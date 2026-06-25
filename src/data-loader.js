// /src/data-loader.js
let cachedNodes = null;
let cachedEdges = null;

window.loadData = function (callback) {
    if (cachedNodes && cachedEdges) {
        return callback(cachedNodes, cachedEdges);
    }

    let nodesData = [], edgesData = [];
    let completed = 0;

    const onLoaded = () => {
        completed++;
        if (completed === 2) {
            cachedNodes = nodesData;
            cachedEdges = edgesData;
            callback(nodesData, edgesData);
        }
    };

    fetch("https://data.weboforigins.com/nodes.csv")
        .then(r => r.text())
        .then(text => Papa.parse(text, {
            delimiter: ";", header: true, complete: r => {
                nodesData = r.data.filter(row => row.id && row.label).map(row => ({
                    id: row.id.trim(),
                    label: (row.label || "").trim().replace(/\u00A0/g, " ").replace(/[\r\n]+/g, " "),
                    type: row.type || "",
                    title: row.title || "",
                    shape: row.shape || "",
                    image: row.image || "",
                    is_sustainable: parseInt(row.is_sustainable, 10) === 1
                }));
                onLoaded();
            }
        }));

    fetch("https://data.weboforigins.com/edges.csv")
        .then(r => r.text())
        .then(text => Papa.parse(text, {
            delimiter: ";", header: true, complete: r => {
                edgesData = r.data.filter(row => row.from_node && row.to_node).map(row => ({
                    from: row.from_node.trim(),
                    to: row.to_node.trim(),
                    label: (row.label || "").trim().replace(/\u00A0/g, " ").replace(/[\r\n]+/g, " "),
                    title: row.title || "",
                    roleCount: parseInt(row.roleCount, 10) || 1,
                    is_same_level: row.is_same_level === "1"
                }));
                onLoaded();
            }
        }));
};