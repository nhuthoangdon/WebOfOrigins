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
                return {
                    id: row.id,
                    label: cleanedLabel,
                    type: row.type,
                    title: title,
                    shape: row.shape || "",
                    image: row.image || ""
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
                        return {
                            from: row.from_node,
                            to: row.to_node,
                            label: cleanedLabel,
                            title: title,
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
        Consumer: { 
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
        Industry: { 
            background: "#F1F48F", highlight: "#FFE328",
            hover: "#FFFAD5"
        },
        Country: { 
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
            background: "#FF5926", highlight: "#FF1C04",
            hover: "#FAB6A1"
        }
    };

    // Define level mapping for hierarchical layout
    const levelMap = {
        Consumer: 0,
        Item: 1,
        Composition: 2,
        Source: 3,
        Country: 4,     
        Industry: 5,
        Concern: 6,
        Consequence: 7,
        Impact: 8
    };

// Calculate the degree (number of edges) for each node
const nodeDegrees = {};
nodesData.forEach(node => {
nodeDegrees[node.id] = 0; // Initialize degree to 0 for each node
});

edgesData.forEach(edge => {
// Increment degree for both 'from' and 'to' nodes
nodeDegrees[edge.from] = (nodeDegrees[edge.from] || 0) + 1;
nodeDegrees[edge.to] = (nodeDegrees[edge.to] || 0) + 1;
});

// Filter out unconnected nodes
const connectedNodesData = nodesData.filter(node => nodeDegrees[node.id] > 0);

// Prepare nodes for Vis.js with size based on degree and level based on type
const nodes = new vis.DataSet(connectedNodesData.map(node => {
const degree = nodeDegrees[node.id] || 0;
const nodeLevel = levelMap[node.type] !== undefined ? levelMap[node.type] : 0; // Fallback to level 0
const isFlagNode = node.type === "Country" || node.type === "Consumer";
const nodeSize = 20 + degree * 10; // Base size of 20, plus 10 per edge
const validImage = node.image && node.image !== "https://flagsapi.com//flat/64.png" ? node.image : undefined; // Skip invalid URLs
// console.log(`Node: ${node.label}, Type: ${node.type}, Degree: ${degree}, Size: ${nodeSize}, Level: ${nodeLevel}`); // Debug: Log each node's details
// console.log(`Node: ${node.label}, Title: ${node.title}`);

const nodeData = {
        id: node.id,
        label: wrapText(node.label, 20),
        shape: isFlagNode && node.image ? "image" : "dot",
        image: isFlagNode ? node.image : undefined,
        color: {
            background: colorMap[node.type]?.background || "#FFFFFF",
            border: colorMap[node.type]?.border || "#000000",
            highlight: {
                background: colorMap[node.type]?.highlight || "#0AFA10",
                border: "#7CFC14"
            },
            hover: {
                background: colorMap[node.type]?.hover || "#D9F0EA",
                border: "#7CFC14"
            }
        },
        borderWidthSelected: 2,
        group: node.type,
        size: nodeSize,
        level: nodeLevel,
        title: node.title || "No Description"
    };

    // console.log(`Node ID: ${node.id}, Type: ${node.type}, Shape: ${nodeData.shape}, Image: ${nodeData.image}`);
    return nodeData;
}));

    // Prepare edges for Vis.js
    const edges = new vis.DataSet(edgesData.map(edge => ({
        from: edge.from,
        to: edge.to,
        label: wrapText(edge.label, 20),
        title: edge.title || "No Description",
        arrows: edge.is_same_level ? undefined : "to", // No arrows for same-level, arrows for hierarchical
        font: { 
            align: "horizontal", 
            size: 14,
            color: "#B3C8FF"
         },
        color: { 
            color: "#A3BFFA", 
            highlight: "#7CFC14",
            hover: "#BEF9D4"
        },
    })));

    // Create the network
    const container = document.getElementById("network");
    const data = { nodes: nodes, edges: edges };
    const options = {
        layout: {
            hierarchical: {
                enabled: true,
                direction: "UD",
                levelSeparation: 300,
                nodeSpacing: 300,
                treeSpacing: 200,
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
            navigationButtons: true
        },
        physics: {
            enabled: false, // Can disable if conflict occurs with hierarchical layout
            stabilization: true, //disable if physics is disabled
            // hierarchicalRepulsion: {
            //     avoidOverlap: 1, //Maximise overlap avoidance
            //     nodeDistance: 68, //Minimum distance between nodes
            //     springLength: 200, //Length of edges
            //     centralGravity: 0.0,
            //     springLength: 100,
            //     springConstant: 0.01,
            //     nodeDistance: 120,
            //     damping: 0.09,
            // }
        },
        nodes: {
            shape: "dot",
            font: {
                size: 18,
                align: "center",
                multi: true, //multiline labels
                color: "#FFFFFF"
            },
            chosen: {
                node: true,
                label: function(values, id, selected, hovering) {
                    values.mod = "bold";
                    values.size = 22;
                }                  
            }
        },
        edges: {
            smooth: {
                type: "continuous"
            },
            color: { 
                color: "#A3BFFA", highlight: "#00FFFF" 
            },
            font: {
                multi: true,
                size: 14,
                color: "#B3C8FF",
                strokeWidth: 0
            },
            chosen: {
                label: function(values, id, selected, hovering) {
                    values.size = 18;
                    values.color = "#FFFFFF";
                }                  
            }
        },
        groups: {
            "Consumer": {
                font: {color: colorMap["Consumer"].background},
                chosen: {
                    label: function(values, id, selected, hovering) {
                    values.mod = "bold";
                    values.size = 22;
                        if (selected) {
                            values.color = colorMap["Consumer"].highlight;
                        }
                    }       
                }
            },
            "Item": {
                font: {color: colorMap["Item"].background},
                chosen: {
                    label: function(values, id, selected, hovering) {
                    values.mod = "bold";
                    values.size = 22;
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
                    values.size = 22;
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
                    values.size = 22;
                        if (selected) {
                            values.color = colorMap["Source"].highlight;
                        }
                    }       
                }
            },
            "Industry": {
                font: {color: colorMap["Industry"].background},
                chosen: {
                    label: function(values, id, selected, hovering) {
                    values.mod = "bold";
                    values.size = 22;
                        if (selected) {
                            values.color = colorMap["Industry"].highlight;
                        }
                    }       
                }
            },
            "Country": {
                font: {color: colorMap["Country"].background},
                chosen: {
                    label: function(values, id, selected, hovering) {
                    values.mod = "bold";
                    values.size = 22;
                        if (selected) {
                            values.color = colorMap["Country"].highlight;
                        }
                    }       
                }
            },
            "Concern": {
                font: {color: colorMap["Concern"].background},
                chosen: {
                    label: function(values, id, selected, hovering) {
                    values.mod = "bold";
                    values.size = 22;
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
                    values.size = 22;
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
                    values.size = 22;
                        if (selected) {
                            values.color = colorMap["Impact"].highlight;
                        }
                    }       
                }
            }
        }
    };

    const network = new vis.Network(container, data, options);
}

// Load data and create the network
loadData((nodesData, edgesData) => {
    createNetwork(nodesData, edgesData);
});