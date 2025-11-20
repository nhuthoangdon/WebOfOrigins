let nodes, edges, network;

// Function to load and parse CSV files
function loadData(callback) {
let nodesData = [];
let edgesData = [];

    const DATA_URL = "https://woo-data-proxy.weboforigins.workers.dev";

// Load nodes.csv
Papa.parse(`${DATA_URL}/nodes.csv`, {
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
        Papa.parse(`${DATA_URL}/edges.csv`, {
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
                speed: { x: 10, y: 10, zoom: 0.02 },
                bindToWindow: true 
            },
            multiselect: true,
            navigationButtons: true,
            zoomView: true,
            dragView: true,
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
      closeDrawerBtn.className = "btn-ic-close close-drawer";
closeDrawerBtn.appendChild(closeIcon);

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

//add Close and View Node Buttons to drawerPanel
const optionButtons = document.createElement("div");
    optionButtons.className = "two-option-ctas drawer-options";

const closeDrawerOption = document.createElement("a");
    closeDrawerOption.className = "tertiary-button btn-go-back close-icon close-drawer light-mode";
    closeDrawerOption.innerHTML = "<i class='fa-regular fa-circle-xmark'></i> Close";
    closeDrawerOption.href = "javascript:void(0);";

const goToNodeOption = document.createElement("button");
goToNodeOption.className = "secondary-button icon icon-regular go-to-node light-mode";
goToNodeOption.textContent = "View Node";

optionButtons.appendChild(closeDrawerOption);
optionButtons.appendChild(goToNodeOption);
drawerPanel.appendChild(optionButtons);


function closeDrawer(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Ensure drawerPanel exists
    if (!drawerPanel) return;

    // Target value (px) - matches your CSS right: -400px
    const target = -400;
    const duration = 200; // ms - matches your jQuery 200ms

    const computed = getComputedStyle(drawerPanel);
    const wasDisplayNone = computed.display === "none";

    if (wasDisplayNone) {
        drawerPanel.style.display = "block";
    }

    let startRight = parseFloat(getComputedStyle(drawerPanel).right);
    if (Number.isNaN(startRight)) startRight = 0;

    if (startRight === target) {
        drawerPanel.style.display = "none";
        delete drawerPanel.dataset.currentNodeId;
        return;
    }

    // Cancel any previous animation
    if (drawerPanel._drawerAnim) {
        drawerPanel._drawerAnim.cancelled = true;
    }

    // jQuery 'swing' easing
    const swing = t => 0.5 - Math.cos(t * Math.PI) / 2;
    const startTime = performance.now();
    const anim = { cancelled: false };
    drawerPanel._drawerAnim = anim;

    function step(now) {
        if (anim.cancelled) return;

        const elapsed = now - startTime;
        const tRaw = Math.min(1, elapsed / duration);
        const t = swing(tRaw);
        const current = startRight + (target - startRight) * t;

        drawerPanel.style.right = current + "px";

        if (tRaw < 1) {
            requestAnimationFrame(step);
            return;
        }

        // Animation finished
        drawerPanel.style.right = target + "px";
        drawerPanel.style.display = "none";

        if (drawerPanel._drawerAnim === anim) {
            drawerPanel._drawerAnim = null;
        }
    }

    requestAnimationFrame(step);
    delete drawerPanel.dataset.currentNodeId;
}


document.querySelectorAll(".close-drawer").forEach(btn => {
    btn.addEventListener("click", closeDrawer);
});



const toggleDrawer = (nodeId, nodeLabel) => {
    const isOpen = drawerPanel.classList.contains("open");

    // Update content
    contentContainer.innerHTML = updateDrawerContent(nodeId, nodeLabel);
    drawerPanel.dataset.currentNodeId = nodeId;

    if (!isOpen) {
        // Drawer closed → open it
        drawerPanel.style.display = "block";

        // Let CSS handle transition to open state
        requestAnimationFrame(() => {
            drawerPanel.classList.add("open");
        });

    } else {
        // Drawer already open → update + replay slide-in animation

        // Reset animation state
        drawerPanel.style.display = "block";
        drawerPanel.style.transition = "none";
        drawerPanel.style.right = "-400px";  // animation start point

        // Force reflow to make the browser register the starting position
        drawerPanel.offsetWidth;

        // Apply slide-in transition
        drawerPanel.style.transition = "right 300ms ease";
        drawerPanel.style.right = "0";

        // Ensure open class is present (your CSS might depend on it)
        drawerPanel.classList.add("open");
    }
};


// Unified outside click handler
function handleOutsideClick(event) {
    // Drawer is considered "visible" only when it has the .open class
    const isOpen = drawerPanel.classList.contains("open");
    if (!isOpen) return;

    // Was the click inside the drawer?
    const clickedInside = drawerPanel.contains(event.target);

    // Was the click on a close button or CTA we want to ignore?
    const clickedCloseBtn = event.target.closest(".btn-ic-close, .panel-cta");

    // Close only if: drawer is open + click was outside + not on allowed buttons
    if (!clickedInside && !clickedCloseBtn) {
        closeDrawer();
    }
}
document.addEventListener("click", handleOutsideClick);


// Reusable core function — just does the navigation
function goToNode(nodeId) {
    if (!nodeId) return;

    network.selectNodes([nodeId]);
    network.focus(nodeId, {
        scale: 1.2,
        animation: {
            duration: 800,
            easingFunction: "easeInOutQuad"
        }
    });

    // Optional: smooth scroll the network into view
    const networkEl = document.getElementById("network");
    const topPos = networkEl.getBoundingClientRect().top + window.pageYOffset - 80;
    window.scrollTo({ top: topPos, behavior: "smooth" });

    // Close drawer if it's open
    closeDrawer();
}

// Master click handler — one single delegated listener
document.addEventListener("click", e => {
    const btn = e.target.closest(".go-to-node");
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    let nodeId = null;

    // Case 1: Button inside the drawer → use current drawer node
    if (btn.closest(".global-drawer")) {
        nodeId = drawerPanel?.dataset.currentNodeId;
    }
    // Case 2: Button in search results (or anywhere else) → read from data attribute
    else if (btn.dataset.nodeId) {
        nodeId = btn.dataset.nodeId;
    }
    // Case 3: Fallback — maybe parent has the data (common in result templates)
    else {
        const container = btn.closest("[data-node-id]");
        if (container) nodeId = container.dataset.nodeId;
    }

    if (nodeId) {
        goToNode(nodeId);
    }
});



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
    if (smallSearchInput && smallClearButton && smallResultCount) {
        smallSearchInput.value = '';
        smallClearButton.style.display = 'none';
        matchingNodesSmall = [];
        currentIndexSmall = 0;
        smallResultCount.textContent = '0 of 0';
        network.unselectAll();
    }
    searchResults.innerHTML = "";
    searchResults.style.display = "flex";

    const matchingNodes = nodes.get().filter(node =>
        node.label.toLowerCase().replace(/\n/g, " ").includes(query)
    );
    const fragment = document.createDocumentFragment();

    matchingNodes.forEach(node => {
        const resultDiv = document.createElement("div");
              resultDiv.className = "result-item card";
              resultDiv.setAttribute("data-node-id", node.id); // Store node ID for drawer reference
        const resultItemCTA = document.createElement("div");
              resultItemCTA.className = "two-option-ctas";

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
        GoToBtn.className = "secondary-button go-to-node icon icon-regular";
        GoToBtn.textContent = "See Connections";

        resultDiv.appendChild(GoToBtn);

        const viewMoreBtn = document.createElement("a");
        viewMoreBtn.className = "panel-cta view-node-details icon icon-solid icon-chevron-right";
        const viewMoreIcon = document.createElement("span");
        viewMoreBtn.textContent = "View Details";
        viewMoreBtn.addEventListener("click", () => {
            const nodeId = resultDiv.getAttribute("data-node-id");
            toggleDrawer(nodeId, node.label);
        });
        fragment.appendChild(resultDiv);
        resultDiv.appendChild(resultItemCTA);
        resultItemCTA.appendChild(viewMoreBtn);
        resultItemCTA.appendChild(GoToBtn);
    });
    searchResults.appendChild(fragment);

    if (!matchingNodes.length) {
        searchResults.innerHTML = "<p>No matches found. Please try a different keyword. For best results, try a single keyword and double-check your spelling. The database is updated continuously, so you can also check back soon!</p>";
    }
};

searchInput.onkeypress = (e) => { if (e.key === "Enter") searchBtn.onclick(); };



let matchingNodesSmall = [];
let currentIndexSmall = 0;

const smallSearchInput = document.getElementById('small-search-input');
const smallClearButton = document.getElementById('small-search-clear');
const smallResultCount = document.getElementById('small-search-result-count');
const largeSearchResults = document.getElementById('search-results');

// Debounce the input to improve performance on fast typing
let searchTimeout;
smallSearchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(performSmallSearch, 200); // 200ms debounce
});

if (smallSearchInput && smallClearButton && smallResultCount) {
    function performSmallSearch() {
        // Clear large search results to avoid conflicts
        largeSearchResults.style.display = 'none';
        largeSearchResults.innerHTML = '';

        const keyword = smallSearchInput.value.toLowerCase().trim();
        matchingNodesSmall = nodes.getIds().filter(id => {
            const node = nodes.get(id);
            return node && node.label.toLowerCase().replace(/\n/g, ' ').includes(keyword);
        });

        currentIndexSmall = 0;
        smallClearButton.style.display = keyword.length > 0 ? 'block' : 'none';
        smallResultCount.textContent = matchingNodesSmall.length > 0 ? `1 of ${matchingNodesSmall.length}` : '0 of 0';
        network.setSelection({ nodes: matchingNodesSmall }, { highlightEdges: true });
        if (matchingNodesSmall.length > 0) {
            network.focus(matchingNodesSmall[0], { scale: 1.5, animation: true });
            const networkElement = document.getElementById('network');
            const topPos = networkElement.getBoundingClientRect().top + window.scrollY - 50;
            window.scrollTo({ top: topPos, behavior: 'smooth' });
        } else {
            network.unselectAll();
        }
    }

    smallSearchInput.addEventListener('input', performSmallSearch);

    smallSearchInput.addEventListener('focus', () => {
        if (smallSearchInput.value.trim().length > 0) {
            performSmallSearch();
        }
    });

    smallSearchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            if (matchingNodesSmall.length > 0) {
                currentIndexSmall = (currentIndexSmall + 1) % matchingNodesSmall.length;
                smallResultCount.textContent = `${currentIndexSmall + 1} of ${matchingNodesSmall.length}`;
                network.focus(matchingNodesSmall[currentIndexSmall], { scale: 1.5, animation: true });
                const networkElement = document.getElementById('network');
                const topPos = networkElement.getBoundingClientRect().top + window.scrollY - 50;
                window.scrollTo({ top: topPos, behavior: 'smooth' });
            }
        }
    });

    smallClearButton.addEventListener('click', () => {
        smallSearchInput.value = '';
        smallClearButton.style.display = 'none';
        matchingNodesSmall = [];
        currentIndexSmall = 0;
        smallResultCount.textContent = '0 of 0';
        network.unselectAll();
        // Clear large search results
        largeSearchResults.style.display = 'none';
        largeSearchResults.innerHTML = '';
    });
}


function toggleCountryNodes(show) {
    if (show === undefined) return console.error("toggleCountryNodes: missing 'show' param");

    const countryNodeIds = nodes.getIds({
        filter: node => ['iCountry', 'smCountry', 'icCountry'].includes(node.group)
    });

    nodes.update(countryNodeIds.map(id => ({ id, hidden: !show })));
}


// Load data and create the network
loadData((nodesData, edgesData) => {
    createNetwork(nodesData, edgesData);
});



document.addEventListener('DOMContentLoaded', () => {
    const panel = document.getElementById('control-panel');
    const toggle = document.getElementById('control-panel-toggle');
    const icon = toggle.querySelector('i');
    const media = window.matchMedia('(max-width: 481px)');

    // Helper: set correct icon + aria-label based on state & viewport
    const updateIconAndAria = () => {
        const isCollapsed = panel.classList.contains('collapsed');
        toggle.setAttribute('aria-label', isCollapsed ? 'Expand control panel' : 'Collapse control panel');

        if (media.matches) {
            // Mobile: ↑ when collapsed, ↓ when expanded
            icon.className = isCollapsed ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
        } else {
            // Desktop: ← when collapsed, → when expanded
            icon.className = isCollapsed ? 'fas fa-chevron-left' : 'fas fa-chevron-right';
        }
    };

    // Initial setup + respond to viewport changes
    const handleViewportChange = (e) => {
        panel.classList.add('collapsed');     // always start collapsed
        updateIconAndAria();
    };

    handleViewportChange(media);              // run once on load
    media.addEventListener('change', handleViewportChange);

    // Toggle click
    toggle.addEventListener('click', (e) => {
        e.stopPropagation();                  // prevent outside-click handler from firing immediately
        panel.classList.toggle('collapsed');
        updateIconAndAria();
    });

    // Outside click → collapse
    document.addEventListener('click', (e) => {
        const clickedInside = panel.contains(e.target) || toggle.contains(e.target);
        const isExpanded = !panel.classList.contains('collapsed');

        if (isExpanded && !clickedInside) {
            panel.classList.add('collapsed');
            updateIconAndAria();
        }
    });

    // Allow Escape key to collapse (great for accessibility)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !panel.classList.contains('collapsed')) {
            panel.classList.add('collapsed');
            updateIconAndAria();
            toggle.focus(); // return focus to toggle button
        }
    });
});
