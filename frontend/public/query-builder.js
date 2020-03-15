/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */


CampusExplorer.buildQuery = function () {
    id = getID();
    let query = {};
    let form = document.getElementsByClassName('tab-panel active');
    query.push(getFilters());
    // query.push(getColumns());
    // query.push(getOrder());
    // query.push(getGroup());
    return query;
};

function getID() {
    let activeNav = document.getElementsByClassName('nav-item tab active')[0];
    return activeNav.getAttribute('data-type')
}

// retrieve filter info
function getField(curCond) {
    let fieldP = curCond.getElementsByClassName('control fields')[0];
    for (let curField of fieldP.querySelectorAll('option')) {
        if (curField.hasAttribute('selected')) {
            return curField.getAttribute('value');
        }
    }
}

function getOperator(curCond) {
    let operatorP = curCond.getElementsByClassName('control operators')[0];
    for (let curField of operatorP.querySelectorAll('option')) {
        if (curField.hasAttribute('selected')) {
            return curField.getAttribute('value');
        }
    }
}

function getTerm(curCond) {
    let termP = curCond.getElementsByClassName('control term')[0];
    return termP.querySelector('input').getAttribute('value');
}

function getFilter(curCond) {
    let curQuery = {};
    let notP = curCond.getElementsByClassName('control not')[0];
    let hasNot = notP.querySelector('input').hasAttribute('checked');
    let field = getField(curCond);
    let operator = getOperator(curCond);

    if (hasNot) {
        return { NOT: curQuery };
    }
    return curQuery;
}

function getFilters() {
    let logic = "";
    for (let id of [ 'courses-conditiontype-all', 'courses-conditiontype-any', 'courses-conditiontype-none' ]) {
        let cur = document.getElementById(id);
        if (cur.hasAttribute('checked')) {
            logic = cur.getAttribute('value');
            break;
        }
    }
    let filters = [];
    let allConds = document.getElementsByClassName('conditions-container')[0];
    for (let curCond of allConds.querySelectorAll('div')) {
        filters.push(getFilter(curCond));
    }
    logic = logic === 'all' ? 'AND' : logic === 'any' ? 'OR' : 'NOT';
    // console.log(logic);
    return { logic: filters };
}

/*
function getColumns() {

}

function getOrder() {

}

function getGroup() {

}
 */
