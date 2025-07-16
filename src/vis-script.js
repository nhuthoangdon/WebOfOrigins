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
                // console.log(`Raw Node Label: "${rawLabel}" (Length: ${rawLabel.length})`);
                // console.log(`Cleaned Node Label: "${cleanedLabel}" (Length: ${cleanedLabel.length})`);
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
                        // console.log(`Raw Edge Label: "${rawLabel}" (Length: ${rawLabel.length})`);
                        // console.log(`Cleaned Edge Label: "${cleanedLabel}" (Length: ${cleanedLabel.length})`);
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

function wrapText(text, maxChars = 15) { //function to wrap long label text into multiple lines
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

    // edgesData.forEach(edge => {
    // // Increment degree for both 'from' and 'to' nodes
    // nodeDegrees[edge.from] = (nodeDegrees[edge.from] || 0) + 1;
    // nodeDegrees[edge.to] = (nodeDegrees[edge.to] || 0) + 1;
    // });

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
    const nodes = new vis.DataSet(connectedNodesData.map(node => {
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
        console.log(`Node: ${node.label}, Degree: ${degree}, Offset: ${offset}, ScaledOffset: ${offset / 10}, Level: ${nodeLevel}`);
        
        const isFlagNode = ['iCountry', 'smCountry', 'icCountry'].includes(node.type);
        const nodeSize = 20 + degree * 10; // Base size of 20, plus 10 per edge
        const validImage = node.image && node.image !== "https://flagsapi.com//flat/64.png" ? node.image : undefined; // Skip invalid URLs
        const title = node.is_sustainable ? `${node.title || "No Description"} (Sustainable)` : node.title || "No Description";

        // console.log(`Node: ${node.label}, Type: ${node.type}, Degree: ${degree}, Size: ${nodeSize}, Level: ${nodeLevel}`); // Debug: Log each node's details
        // console.log(`Node: ${node.label}, Title: ${node.title}`);

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

            // console.log(`Node ID: ${node.id}, Type: ${node.type}, Shape: ${nodeData.shape}, Image: ${nodeData.image}`);
            return nodeData;
}));

    // Prepare edges for Vis.js
    const edges = new vis.DataSet(edgesData.map((edge, index, edgesArray) => {
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
                            values.color = colorMap["iCountry"].highlight;
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
                            values.color = colorMap["Item"].highlight;
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
                            values.color = colorMap["Composition"].highlight;
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
                            values.color = node.is_sustainable ? "#0DAA01" : colorMap["Source"].highlight;
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
                            values.color = node.is_sustainable ? "#0DAA01" : colorMap["rawMaterial"].highlight;
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
                            values.color = node.is_sustainable ? "#0DAA01" : colorMap["Industry"].highlight;
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
                            values.color = colorMap["smCountry"].highlight;
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
                            values.color = colorMap["icCountry"].highlight;
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
                            values.color = colorMap["Concern"].highlight;
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
                            values.color = colorMap["Consequence"].highlight;
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
                            values.color = colorMap["Impact"].highlight;
                        }
                    }       
                }
            }
        }
    };

    const network = new vis.Network(container, data, options);

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

}

// Load data and create the network
loadData((nodesData, edgesData) => {
    createNetwork(nodesData, edgesData);
});