/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = function (query) {
    return new Promise(function (fulfill, reject) {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "http://localhost:4321/query", true);
        xhr.setRequestHeader("Content-Type", "string");
        xhr.send(JSON.stringify(query));
        xhr.onload = function () {
            if (xhr.status === 200) {
                fulfill(xhr.response);
            } else {
                reject(xhr.response);
            }
        };
        xhr.onerror = function () {
            reject(xhr.response);
        };
        // console.log("CampusExplorer.sendQuery not implemented yet.");
    });
};
