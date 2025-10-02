let nodes, edges, network;

// Function to load and parse CSV files
function loadData(callback) {
let nodesData = [];
let edgesData = [];

// Load nodes.csv
Papa.parse("data/nodes.csv", {
    download: true,
    delimiter: ";",
    header: true,
    complete: function (results) {
        nodesData = results.data
            .filter(row => row.id && row.label) //Exclude rows with missing id or label
            .map(row => {
                // Safely handle the label
                const rawLabel = typeof row.label === "string" ? row.label : "";
                const cleanedLabel = rawLabel
                    .trim() // Remove leading/trailing whitespace
                    .replace(/\u00A0/g, " ") // Replace non-breaking spaces with regular spaces
                    .replace(/[\r\n]+/g, " "); // Replace newlines with spaces
                const title = row.title || ""; //fallback to empty string if missing
                const is_sustainable = parseInt(row.is_sustainable, 10) === 1;
                return {
                    id: row.id,
                    label: cleanedLabel,
                    type: row.type,
                    title: title,
                    shape: row.shape || "",
                    image: row.image || "",
                    is_sustainable: is_sustainable
                };
        });

        // Load edges.csv
        Papa.parse("data/edges.csv", {
            download: true,
            delimiter: ";",
            header: true,
            complete: function (results) {
                edgesData = results.data
                    .filter(row => row.from_node && row.to_node) // Exclude rows with missing from_node or to_node
                    .map(row => {
                        // Safely handle the label
                        const rawLabel = typeof row.label === "string" ? row.label : "";
                        const cleanedLabel = rawLabel
                            .trim()
                            .replace(/\u00A0/g, " ")
                            .replace(/[\r\n]+/g, " ");
                        const title = row.title || "";
                        const roleCount = parseInt(row.roleCount, 10) || 1; // Convert to number, default to 1 if missing
                        return {
                            from: row.from_node,
                            to: row.to_node,
                            label: cleanedLabel,
                            title: title,
                            roleCount: roleCount, //newly added
                            is_same_level: row.is_same_level === "1" //convert to boolean-like
                        };
                    });
                callback(nodesData, edgesData);
            },
            error: function (error) {
                console.error("Error loading data/edges.csv:", error);
            }
        });
    },
    error: function (error) {
        console.error("Error loading data/nodes.csv:", error);
    }
});
}

function wrapText(text, maxChars = 30) { //function to wrap long label text into multiple lines
if (!text) return "";  // Prevent errors if label is missing
return text.replace(new RegExp(`(.{1,${maxChars}})(\\s|$)`, "g"), "$1\n").trim();
}


// Function to create the network
function createNetwork(nodesData, edgesData) {
    // Define color mapping based on node type (to match the diagram)
    const colorMap = {
        Item: { 
            background: "#25B9FE", highlight: "#107CAE",
            hover: "#BDDBFA"
        },
        iCountry: { 
            background: "#DFE2E5", highlight: "#DAF332",
            hover: "#BDDBFA"
        },
        Composition: { 
            background: "#C869ED", highlight: "#BF16F6",
            hover: "#E1ABF8"
        },
        Source: { 
            background: "#6591FF", highlight: "#0546FF",
            hover: "#ACBEEB"
        },
        rawMaterial: {
            background: "#CEA372", highlight: "#955813",
            hover: "#C2AA8E"
        },
        Industry: { 
            background: "#60A4C2", highlight: "#2F647C",
            hover: "#8BA6B2"
        },
        smCountry: { 
            background: "#DFE2E5", highlight: "#DAF332",
            hover: "#BDDBFA"
        },
        icCountry: { 
            background: "#DFE2E5", highlight: "#DAF332",
            hover: "#BDDBFA"
        },
        Concern: { 
            background: "#FBB53B", highlight: "#FF7E00",
            hover: "#FBDBA3"
        },
        Consequence: { 
            background: "#F05CCB", highlight: "#E800AE",
            hover: "#F2A9E0"
        },     
        Impact: { 
            background: "#FB7E57", highlight: "#FF1C04",
            hover: "#FAB6A1"
        }
    };

    // Define level mapping for hierarchical layout
    const levelMap = {
        iCountry: 0,
        Item: 1,
        Composition: 2,
        Source: 3,
        smCountry: 4,
        rawMaterial: 5, 
        Industry: 6,
        icCountry: 7,
        Concern: 8,
        Consequence: 9,
        Impact: 10
    };

    // Calculate the degree (number of edges) for each node
    const nodeDegrees = {};
    nodesData.forEach(node => {
    nodeDegrees[node.id] = 0; // Initialize degree to 0 for each node
    });

        edgesData.forEach(edge => {
        // Determine if 'from' or 'to' nodes are country nodes
        const fromNode = nodesData.find(node => node.id === edge.from);
        const toNode = nodesData.find(node => node.id === edge.to);
        const isFromCountry = fromNode && ['iCountry', 'smCountry', 'icCountry'].includes(fromNode.type);
        const isToCountry = toNode && ['iCountry', 'smCountry', 'icCountry'].includes(toNode.type);
        
        // Use roleCount for country nodes, default to 1 for others
        const edgeWeight = !isNaN(parseInt(edge.roleCount, 10)) && edge.roleCount > 0 ? parseInt(edge.roleCount, 10) : 1;
        
        // Increment degree: use roleCount for country nodes, 1 for others
        nodeDegrees[edge.from] = (nodeDegrees[edge.from] || 0) + (isFromCountry ? edgeWeight : 1);
        nodeDegrees[edge.to] = (nodeDegrees[edge.to] || 0) + (isToCountry ? edgeWeight : 1);
    });

    // Filter out unconnected nodes
    const connectedNodesData = nodesData.filter(node => nodeDegrees[node.id] > 0);

    // Prepare nodes for Vis.js with size based on degree and level based on type
        nodes = new vis.DataSet(connectedNodesData.map(node => {
        const degree = nodeDegrees[node.id] || 0;
        // const nodeLevel = levelMap[node.type] !== undefined ? levelMap[node.type] : 0; //leveling based on node level settings
        // const nodeLevel = levelMap[node.label] || levelMap[node.type] || 0; //apply sub-levels to specific nodes e.g. Shrimp Farming: 6.2, Crab Farming: 6.3
        const baseLevel = levelMap[node.type] !== undefined ? levelMap[node.type] : 0;
        const connectedSameLevelEdges = edgesData.filter(edge => edge.is_same_level && (edge.from === node.id || edge.to === node.id));
        
        const maxOffset = 200;
        let offset = 0;
        if (connectedSameLevelEdges.length > 0) {
            offset = maxOffset * (1 / (degree + 1)); // Small inverse offset, e.g., degree 0 = 20, degree 1 = 10, degree 2 = 6.7
            offset = Math.min(offset, maxOffset); // Cap explicitly
        }
        const nodeLevel = baseLevel + (offset / 100); // Higher division for slight offset
        
        const isFlagNode = ['iCountry', 'smCountry', 'icCountry'].includes(node.type);
        const nodeSize = 20 + degree * 10; // Base size of 20, plus 10 per edge
        const validImage = node.image && node.image !== "https://flagsapi.com//flat/64.png" ? node.image : undefined; // Skip invalid URLs
        const title = node.is_sustainable ? `${node.title || "No Description"} (Sustainable)` : node.title || "No Description";

        const nodeData = {
            id: node.id,
            label: wrapText(node.label, 20),
            shape: isFlagNode && validImage ? "image" : "dot",
            image: isFlagNode && validImage ? node.image : undefined,
            color: {
                background: node.is_sustainable && ['Source', 'rawMaterial', 'Industry'].includes(node.type) ? "#38E648" : (colorMap[node.type]?.background || "#FFFFFF"),
                border: node.is_sustainable && ['Source', 'rawMaterial', 'Industry'].includes(node.type) ? "#38E648" : (colorMap[node.type]?.border || "#000000"),
                highlight: {
                    background: node.is_sustainable && ['Source', 'rawMaterial', 'Industry'].includes(node.type) ? "#0DAA01" : (colorMap[node.type]?.highlight || "#0AFA10"),
                    border: node.is_sustainable && ['Source', 'rawMaterial', 'Industry'].includes(node.type) ? "#72F300" : (colorMap[node.type]?.border || "#7CFC14")
                },
                hover: {
                    background: node.is_sustainable && ['Source', 'rawMaterial', 'Industry'].includes(node.type) ? "#98F79F" : (colorMap[node.type]?.hover || "#D9F0EA"),
                    border: node.is_sustainable && ['Source', 'rawMaterial', 'Industry'].includes(node.type) ? "#B4FF00" : (colorMap[node.type]?.border || "#7CFC14")
                }
            },
            font: {
                color: node.is_sustainable && ['Source', 'rawMaterial', 'Industry'].includes(node.type) ? "#38E648" : (colorMap[node.type]?.background || "#FFFFFF"),
                size: 24,
                align: "center",
                multi: true,
            },
            borderWidthSelected: node.is_sustainable && ['Source', 'rawMaterial', 'Industry'].includes(node.type) ? 4 : 2,
            group: node.type,
            size: nodeSize,
            level: nodeLevel,
            title: node.title || "No Description"
        };
            return nodeData;
    }));

    // Prepare edges for Vis.js
    edges = new vis.DataSet(edgesData.map((edge, index, edgesArray) => {
        // Check for multiple edges between the same nodes
        const sameNodeEdges = edgesArray.filter(e => 
            (e.from === edge.from && e.to === edge.to) || 
            (e.from === edge.to && e.to === edge.from)
        );
        const edgeIndex = sameNodeEdges.indexOf(edge);
            
        return {
            from: edge.from,
            to: edge.to,
            label: wrapText(edge.label, 40),
            title: edge.title || "No Description",
            arrows: edge.is_same_level ? undefined : "to",
            font: { 
                align: "middle", 
                size: 18,
                color: "#B3C8FF",
                strokeWidth: 0, // Remove stroke to avoid visual offset
                multi: true // Support multiline labels
            },
            color: { 
                color: "#A3BFFA", 
                highlight: "#7CFC14",
                hover: "#BEF9D4"
            },
            smooth: {
                enabled: true,
                type: sameNodeEdges.length > 1 ? (edgeIndex % 2 === 0 ? 'curvedCW' : 'curvedCCW') : 'continuous', // Use 'continuous' for single edges
                roundness: sameNodeEdges.length > 1 ? 0.1 * (edgeIndex + 1) : 0.2 // Reduced roundness
            }
        };
    }));
    
    // Create the network
    const container = document.getElementById("network");
    const data = { nodes: nodes, edges: edges };
    const options = {
        layout: {
            hierarchical: {
                enabled: true,
                direction: "UD",
                levelSeparation: 600,
                nodeSpacing: 600,
                treeSpacing: 400,
                sortMethod: "hubsize", //hubsize or directed
                shakeTowards: "leaves",
                blockShifting: true,
                edgeMinimization: true
            },
            improvedLayout: true,
        },
        interaction: {
            hover: true,
            tooltipDelay: 100,
            keyboard: {
                enabled: true,
            },
            multiselect: true,
            navigationButtons: true,
            dragNodes: true,
            hoverEdges: true
        },
        physics: {
            enabled: false, // Can disable if conflict occurs with hierarchical layout
            stabilization: {
                enabled: true, //disable if physics is disabled
                iterations: 100,
                fitRange: 0.1
            },
            hierarchicalRepulsion: {
                avoidOverlap: 1, //Maximise overlap avoidance
                nodeDistance: 300, //Minimum distance between nodes
                springLength: 500, //Length of edges
                centralGravity: 0.0,
                springConstant: 0.005, //Lower for softer repulsion
                damping: 0.2, //higher to stabilise quickly
            },
            solver: "hierarchicalRepulsion" // Ensure hierarchical solver is used
        },
        nodes: {
            shape: "dot",
            font: {
                size: 24,
                align: "center",
                multi: true, //multiline labels
                color: "#FFFFFF"
            },
            chosen: {
                node: true,
                label: function(values, id, selected, hovering) {
                    values.mod = "bold";
                    values.size = 28;
                    values.color = "#DAF332";
                }                  
            },
            scaling: {
                // min: 10,
                // max: 500,
                customScalingFunction: function(min, max, total, value) {
                return 0.5 + (value / total) * 0.5; // Smoother scaling for node sizes
                }
            }
        },
        edges: {
            smooth: {
                enabled: true,
                type: "continuous", //or change to cubicBezier for smoother curves
                roundness: 0.2 //if use cubicBezier, increase for less entanglement
            },
            color: { 
                color: "#A3BFFA", highlight: "#00FFFF" 
            },
            font: {
                multi: true,
                size: 18,
                color: "#B3C8FF",
                strokeWidth: 0,
                align: 'middle'
            },
            chosen: {
                label: function(values, id, selected, hovering) {
                    values.size = 20;
                    values.color = "#FFFFFF";
                    values.mod = "bold";
                    values.align = "middle"; // Reinforce middle alignment on selection
                }                  
            }
        },
        groups: {
            "iCountry": {
                shape: "image",
                font: {color: colorMap["iCountry"].background},
                chosen: {
                    label: function(values, id, selected, hovering) {
                    values.mod = "bold";
                    values.size = 28;
                        if (selected) {
                            // values.color = colorMap["iCountry"].highlight;
                            values.color = "#DAF332";
                        }
                    }       
                }
            },
            "Item": {
                font: {color: colorMap["Item"].background},
                chosen: {
                    label: function(values, id, selected, hovering) {
                    values.mod = "bold";
                    values.size = 28;
                        if (selected) {
                            // values.color = colorMap["Item"].highlight;
                            values.color = "#DAF332";
                        }
                    }       
                }
            },
            "Composition": {
                font: {color: colorMap["Composition"].background},
                chosen: {
                    label: function(values, id, selected, hovering) {
                    values.mod = "bold";
                    values.size = 28;
                        if (selected) {
                            // values.color = colorMap["Composition"].highlight;
                            values.color = "#DAF332";
                        }
                    }       
                }
            },
            "Source": {
                font: {color: colorMap["Source"].background},
                chosen: {
                    label: function(values, id, selected, hovering) {
                    values.mod = "bold";
                    values.size = 28;
                    const node = nodesData.find(n => n.id === id);
                        if (selected) {
                            values.color = node.is_sustainable ? "#0DAA01" : values.color = "#DAF332";
                        }
                    }       
                }
            },
            "rawMaterial": {
                font: {color: colorMap["rawMaterial"].background},
                chosen: {
                    label: function(values, id, selected, hovering) {
                    values.mod = "bold";
                    values.size = 28;
                    const node = nodesData.find(n => n.id === id);
                        if (selected) {
                            // values.color = colorMap["rawMaterial"].highlight;
                            values.color = node.is_sustainable ? "#0DAA01" : values.color = "#DAF332";
                        }
                    }       
                }
            },
            "Industry": {
                font: {color: colorMap["Industry"].background},
                chosen: {
                    label: function(values, id, selected, hovering) {
                    values.mod = "bold";
                    values.size = 28;
                    const node = nodesData.find(n => n.id === id);
                        if (selected) {
                            values.color = node.is_sustainable ? "#0DAA01" : values.color = "#DAF332";
                        }
                    }       
                }
            },
            "smCountry": {
                shape: "image",
                font: { color: colorMap["smCountry"].background },
                chosen: {
                    label: function(values, id, selected, hovering) {
                        values.mod = "bold";
                        values.size = 28;
                        if (selected) {
                            // values.color = colorMap["smCountry"].highlight;
                            values.color = "#DAF332";
                        }
                    }
                }
            },
            "icCountry": {
                shape: "image",
                font: { color: colorMap["icCountry"].background },
                chosen: {
                    label: function(values, id, selected, hovering) {
                        values.mod = "bold";
                        values.size = 28;
                        if (selected) {
                            // values.color = colorMap["icCountry"].highlight;
                            values.color = "#DAF332";
                        }
                    }
                }
            },
            "Concern": {
                font: {color: colorMap["Concern"].background},
                chosen: {
                    label: function(values, id, selected, hovering) {
                    values.mod = "bold";
                    values.size = 28;
                        if (selected) {
                            // values.color = colorMap["Concern"].highlight;
                            values.color = "#DAF332";
                        }
                    }       
                }
            },
            "Consequence": {
                font: {color: colorMap["Consequence"].background},
                chosen: {
                    label: function(values, id, selected, hovering) {
                    values.mod = "bold";
                    values.size = 28;
                        if (selected) {
                            // values.color = colorMap["Consequence"].highlight;
                            values.color = "#DAF332";
                        }
                    }       
                }
            },
            "Impact": {
                font: {color: colorMap["Impact"].background},
                chosen: {
                    label: function(values, id, selected, hovering) {
                    values.mod = "bold";
                    values.size = 28;
                        if (selected) {
                            // values.color = colorMap["Impact"].highlight;
                            values.color = "#DAF332";
                        }
                    }       
                }
            }
        }
    };

    network = new vis.Network(container, data, options);

        network.on("selectNode", function (params) {
        const selectedNodeIds = params.nodes; // Support multiple selected nodes
        const highlightDepth = 1; // Adjust depth of highlighted nodes

        // Get nodes and edges to highlight
        let nodesToHighlight = new Set(selectedNodeIds);
        let edgesToHighlight = new Set();

        // Collect nodes up to specified depth for each selected node
        for (let depth = 0; depth < highlightDepth; depth++) {
            let currentNodes = new Set(nodesToHighlight);
            currentNodes.forEach(nodeId => {
                network.getConnectedNodes(nodeId).forEach(connectedNodeId => {
                    nodesToHighlight.add(connectedNodeId);
                });
            });
        }

        // Collect edges only between highlighted nodes
        nodesToHighlight.forEach(nodeId => {
            network.getConnectedEdges(nodeId).forEach(edgeId => {
                const edge = edges.get(edgeId);
                if (nodesToHighlight.has(edge.from) && nodesToHighlight.has(edge.to)) {
                    edgesToHighlight.add(edgeId);
                }
            });
        });


        // Use network.setSelection to apply highlighting
        network.setSelection({
            nodes: Array.from(nodesToHighlight),
            edges: Array.from(edgesToHighlight)
        }, {
            highlightEdges: false // Prevent default edge highlighting
        });
    });

        network.on("dragStart", function (params) {
            if (params.nodes.length > 0) {
                network.setOptions({
                    physics: {
                        enabled: true,
                        stabilization: true,
                        hierarchicalRepulsion: {
                            avoidOverlap: 1,
                            nodeDistance: 150,
                            springLength: 200
                        }
                    }
                });
            }
        });

        network.on("dragEnd", function (params) {
            network.setOptions({
                physics: {
                    enabled: false
                }
            });
            // Store current position and scale
            const { x, y, scale } = network.getViewPosition();
            // Disable stabilization and reapply view position
            network.moveTo({ position: { x, y }, scale, animation: false });
        });
        
        network.on("click", function (params) {
            if (params.nodes.length === 1) {
                const selectedNodeIds = params.nodes;
                const highlightDepth = 1;
                let nodesToHighlight = new Set(selectedNodeIds);
                let edgesToHighlight = new Set();

                for (let depth = 0; depth < highlightDepth; depth++) {
                    let currentNodes = new Set(nodesToHighlight);
                    currentNodes.forEach(nodeId => {
                        network.getConnectedNodes(nodeId).forEach(connectedNodeId => {
                            nodesToHighlight.add(connectedNodeId);
                        });
                    });
                }

                nodesToHighlight.forEach(nodeId => {
                    network.getConnectedEdges(nodeId).forEach(edgeId => {
                        const edge = edges.get(edgeId);
                        if (nodesToHighlight.has(edge.from) && nodesToHighlight.has(edge.to)) {
                            edgesToHighlight.add(edgeId);
                        }
                    });
                });

                network.setSelection({
                    nodes: Array.from(nodesToHighlight),
                    edges: Array.from(edgesToHighlight)
                }, {
                    highlightEdges: false
                });
            } else if (params.nodes.length === 0 && params.edges.length === 0) {
                network.unselectAll();
            }
         });

    // Ensure toggle element exists and bind event
    const toggleElement = document.getElementById('country-toggle');
    if (toggleElement) {
        toggleElement.addEventListener('change', function (event) {
            toggleCountryNodes(event.target.checked); // Explicitly use event.target.checked
        });
    } else {
        console.error("Country toggle element (#country-toggle) not found in DOM");
         }

}


const searchInput = document.getElementById("large-search-input");
const searchBtn = document.getElementById("large-search-btn");
const searchResults = document.getElementById("search-results");
const drawerPanel = document.createElement("div");
      drawerPanel.className = "global-drawer";
      drawerPanel.style.display = "none";

// Add close button as a persistent element
const closeIcon = document.createElement("i");
      closeIcon.className = "fa-solid fa-xmark fa-lg";
const closeDrawerBtn = document.createElement("div");
      closeDrawerBtn.className = "btn-ic-close";
closeDrawerBtn.appendChild(closeIcon);
closeDrawerBtn.addEventListener("click", () => {
    if (window.jQuery) {
        $(drawerPanel).animate({ right: "-400px" }, 300, function () {
            $(this).hide();
        });
    } else {
        drawerPanel.classList.remove("open");
        drawerPanel.addEventListener("transitionend", function hideAfter() {
            if (!drawerPanel.classList.contains("open")) {
                drawerPanel.style.display = "none";
            }
            drawerPanel.removeEventListener("transitionend", hideAfter);
        });
    }
    delete drawerPanel.dataset.currentNodeId; // Clear current node ID when closed
});
drawerPanel.appendChild(closeDrawerBtn);

// Add content container to hold dynamic content
const contentContainer = document.createElement("div");
contentContainer.className = "drawer-content";
drawerPanel.appendChild(contentContainer);

document.body.appendChild(drawerPanel);

// Function to update drawer content
const updateDrawerContent = (nodeId, nodeLabel) => {
    const connectedEdges = network.getConnectedEdges(nodeId);
    if (connectedEdges.length === 0 || connectedEdges.every(edgeId => edges.get(edgeId).title === "No Description")) {
        return `<h3>${nodeLabel.replace(/\n/g, " ")} Highlights</h3><p style="color: #28282bff;">No further info found for this item. Please check back later.</p>`;
    } else {
        const validEdgeTitles = connectedEdges
            .map(edgeId => {
                const edge = edges.get(edgeId);
                return edge.title !== "No Description" ? edge.title : null;
            })
            .filter(title => title !== null)
            .map(title => title || "No further info found.");
        // Convert array to ul with li elements for bullets
        const listItems = validEdgeTitles.map(title => `<li>${title}</li>`).join("");
        return `<h3>${nodeLabel.replace(/\n/g, " ")} Highlights</h3><ul>${listItems}</ul>`;
    }
      };


// Enhanced toggle function to handle open/close and content
const toggleDrawer = (nodeId, nodeLabel) => {
    const isDrawerOpen = window.jQuery ? $(".global-drawer").is(":visible") : drawerPanel.style.display === "block";

    if (isDrawerOpen) {
        if (drawerPanel.dataset.currentNodeId !== nodeId) {
            contentContainer.innerHTML = updateDrawerContent(nodeId, nodeLabel); // Update only content container
            drawerPanel.dataset.currentNodeId = nodeId;
        }
    } else {
        contentContainer.innerHTML = updateDrawerContent(nodeId, nodeLabel); // Update only content container
        if (window.jQuery) {
            $(drawerPanel).show().animate({ right: "0" }, 300);
        } else {
            drawerPanel.style.display = "block";
            drawerPanel.classList.add("open");
        }
        drawerPanel.dataset.currentNodeId = nodeId;
    }
      };

// Unified outside click handler
function handleOutsideClick(event) {
    const isVisible = window.jQuery
        ? $(".global-drawer").is(":visible")
        : drawerPanel.style.display === "block";

    const isClickInside = drawerPanel.contains(event.target);
    const isCloseBtn = event.target.classList.contains("btn-ic-close") ||
        event.target.classList.contains("btn-tertiary");

    if (isVisible && !isClickInside && !isCloseBtn) {
        closeDrawer();
    }
}

function closeDrawer() {
    if (window.jQuery) {
        $(drawerPanel).animate({ right: "-400px" }, 200, function () {
            $(this).hide();
        });
    } else {
        drawerPanel.classList.remove("open");
        drawerPanel.addEventListener("transitionend", function hideAfter() {
            if (!drawerPanel.classList.contains("open")) {
                drawerPanel.style.display = "none";
            }
            drawerPanel.removeEventListener("transitionend", hideAfter);
        });
    }
    delete drawerPanel.dataset.currentNodeId; // Clear current node ID
}

// Bind correct handler
if (window.jQuery) {
    $(document).on("click", handleOutsideClick);
} else {
    document.addEventListener("click", handleOutsideClick);
}
      

let debounceTimeout;
searchInput.onkeypress = (e) => {
    if (e.key === "Enter") {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => searchBtn.onclick(), 300); // 300ms delay
    }
  };
  
searchBtn.onclick = () => {
    const query = searchInput.value.toLowerCase().trim();
    if (!query) return;
    searchResults.innerHTML = "";
    searchResults.style.display = "flex";

    const matchingNodes = nodes.get().filter(node =>
        node.label.toLowerCase().replace(/\n/g, " ").includes(query)
    );
    const fragment = document.createDocumentFragment();

    matchingNodes.forEach(node => {
        const resultDiv = document.createElement("div");
              resultDiv.className = "result-item";
              resultDiv.setAttribute("data-node-id", node.id); // Store node ID for drawer reference
        const resultItemCTA = document.createElement("div");
              resultItemCTA.className = "result-item-cta";

        // Generate pathway text using unwrapped label
        let pathway = `<b style="color: #dfdee8ff;">${node.label.replace(/\n/g, " ")}: </b>`;
        const nodeDescription = (node.title || "No description available.").replace(/\n/g, " ");
        const fromSources = network.getConnectedNodes(node.id, "from").map(id => nodes.get(id).label.replace(/\n/g, " "));
        const toSources = network.getConnectedNodes(node.id, "to").map(id => nodes.get(id).label.replace(/\n/g, " "));

        if (nodeDescription != node.label) {
            pathway += `${nodeDescription}\n`;
        } else {
            pathway += "\n";
        }

        if (fromSources.length > 0) {
            pathway += `- Associates with: ${fromSources.join(", ")}\n`;
        }

        if (toSources.length > 0) {
            pathway += `- Connects to: ${toSources.join(", ")}`;
        }

        const p = document.createElement("p");
        p.innerHTML = pathway;
        resultDiv.appendChild(p);

        const GoToBtn = document.createElement("button");
        GoToBtn.className = "secondary-button";
        GoToBtn.textContent = "See Connections";
        GoToBtn.onclick = () => {
            network.selectNodes([node.id]);
            network.fit({ nodes: [node.id], animation: true });
            window.scrollTo({ top: document.getElementById("network").offsetTop, behavior: "smooth" });
            if (window.jQuery) {
                $(drawerPanel).animate({ right: "-400px" }, 200, function () {
                    $(this).hide();
                });
            } else {
                drawerPanel.classList.remove("open");
                drawerPanel.addEventListener("transitionend", function hideAfter() {
                    if (!drawerPanel.classList.contains("open")) {
                        drawerPanel.style.display = "none";
                    }
                    drawerPanel.removeEventListener("transitionend", hideAfter);
                });
            }
            delete drawerPanel.dataset.currentNodeId; // Clear current node ID when navigating
        };
        resultDiv.appendChild(GoToBtn);

        const ViewMoreBtn = document.createElement("button");
        ViewMoreBtn.className = "btn-tertiary";
        ViewMoreBtn.textContent = "View Details";
        ViewMoreBtn.addEventListener("click", () => {
            const nodeId = resultDiv.getAttribute("data-node-id");
            toggleDrawer(nodeId, node.label);
        });
        fragment.appendChild(resultDiv);
        resultDiv.appendChild(resultItemCTA);
        resultItemCTA.appendChild(ViewMoreBtn);
        resultItemCTA.appendChild(GoToBtn);
    });
    searchResults.appendChild(fragment);

    if (!matchingNodes.length) {
        searchResults.innerHTML = "<p>No matches found. Please try another keyword or check back soon — our database is updated continuously.</p>";
    }
};

searchInput.onkeypress = (e) => { if (e.key === "Enter") searchBtn.onclick(); };


// let matchingNodes = [];
// let currentIndex = 0;

// const searchInput = document.getElementById('node-search');
// const clearButton = document.getElementById('node-search-clear');
// const resultCount = document.getElementById('search-result-count');
// if (searchInput && clearButton && resultCount) {
//     function performSearch() {
//         const keyword = searchInput.value.toLowerCase().trim();
//         matchingNodes = nodes.getIds().filter(id => {
//             const node = nodes.get(id);
//             return node && node.label.toLowerCase().includes(keyword);
//         });

//         currentIndex = 0;
//         clearButton.style.display = keyword.length > 0 ? 'block' : 'none';
//         resultCount.textContent = matchingNodes.length > 0 ? `1 of ${matchingNodes.length}` : '0 of 0';
//         network.setSelection({ nodes: matchingNodes }, { highlightEdges: true });
//         if (matchingNodes.length > 0) {
//             network.focus(matchingNodes[0], { scale: 1.5, animation: true });
//         } else {
//             network.unselectAll();
//         }
//     }

//     searchInput.addEventListener('input', performSearch);

//     searchInput.addEventListener('focus', () => {
//         if (searchInput.value.trim()     // Generate pathway text (example: traverse connections).length > 0) {
//             performSearch();
//         }
//     });

//     searchInput.addEventListener('keydown', function (event) {
//         if (event.key === 'Enter') {
//             event.preventDefault();
//             if (matchingNodes.length > 0) {
//                 currentIndex = (currentIndex + 1) % matchingNodes.length;
//                 resultCount.textContent = `${currentIndex + 1} of ${matchingNodes.length}`;
//                 network.focus(matchingNodes[currentIndex], { scale: 1.5, animation: true });
//             }
//         }
//     });

//     clearButton.addEventListener('click', function () {
//         searchInput.value = '';
//         clearButton.style.display = 'none';
//         matchingNodes = [];
//         currentIndex = 0;
//         resultCount.textContent = '0 of 0';
//         network.unselectAll();
//     });
// }

function toggleCountryNodes(show) {
    if (show === undefined) {
        console.error("Show parameter is undefined, check DOM or event binding");
        return;
    }
    const countryTypes = ['iCountry', 'smCountry', 'icCountry'];
    const countryNodeIds = nodes.getIds().filter(id => {
        const node = nodes.get(id);
        return node && countryTypes.includes(node.group);
    });

    if (show) {
        // When showing, rebuild all nodes with a fresh dataset
        const nonCountryNodes = nodes.get().filter(node => !countryTypes.includes(node.group));
        const countryNodes = countryNodeIds.map(id => {
            const node = nodes.get(id);
            // Create a new object without hidden property
            const { hidden, ...cleanNode } = node;
            return cleanNode;
        });
        nodes.clear(); // Clear existing nodes
        nodes.add([...nonCountryNodes, ...countryNodes]); // Re-add all nodes
    } else {
        // When hiding, set hidden to true
        nodes.update(countryNodeIds.map(id => ({ id, hidden: true })));
    }

    // Refresh the network and adjust layout
    // network.setData({ nodes, edges });
    // network.fit({ animation: false });

    // Verify updated states
    const updatedStates = countryNodeIds.map(id => ({
        id,
        hidden: nodes.get(id)?.hidden || false
    }));
}


// Load data and create the network
loadData((nodesData, edgesData) => {
    createNetwork(nodesData, edgesData);
});



document.addEventListener('DOMContentLoaded', function () {
    const panel = document.getElementById('control-panel');
    const toggle = document.getElementById('control-panel-toggle');
    const icon = toggle.querySelector('i');

    toggle.addEventListener('click', function () {
        panel.classList.toggle('collapsed');
        if (panel.classList.contains('collapsed')) {
            icon.classList.remove('fa-chevron-right');
            icon.classList.add('fa-chevron-left');
            toggle.setAttribute('aria-label', 'Expand control panel');
        } else {
            icon.classList.remove('fa-chevron-left');
            icon.classList.add('fa-chevron-right');
            toggle.setAttribute('aria-label', 'Collapse control panel');
        }
    });
});

document.addEventListener('click', function (event) {
    const panel = document.getElementById('control-panel');
    const toggle = document.getElementById('control-panel-toggle');
    if (!panel.contains(event.target) && !toggle.contains(event.target) && !panel.classList.contains('collapsed')) {
        panel.classList.add('collapsed');
        toggle.querySelector('i').classList.remove('fa-chevron-right');
        toggle.querySelector('i').classList.add('fa-chevron-left');
        toggle.setAttribute('aria-label', 'Expand control panel');
    }
});
