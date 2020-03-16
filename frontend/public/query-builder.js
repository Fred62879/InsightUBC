/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */

let query = {};
let id = '';

CampusExplorer.buildQuery = function () {
// function all() {
    id = getID();
    let form = document.getElementsByClassName('tab-panel active');
    query.WHERE = getFilters();
    query.OPTIONS = getOptions();

    let trans = getTrans();
    if (trans !== null) {
        query.TRANSFORMATIONS = trans;
    }
    return query;
};

function getID() {
    let activeNav = document.getElementsByClassName('tab-panel active')[0];
    return activeNav.getAttribute('data-type');
}

// ** Retrieve filter info
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

function getTerm(curCond, operator) {
    let termP = curCond.getElementsByClassName('control term')[0];
    let val = termP.querySelector('input').getAttribute('value');
    if (operator === 'IS') {
        return val;
    }
    if (val === null) {
        return null;
    }
    return Number(val);
}

function getFilter(curCond) {
    let notP = curCond.getElementsByClassName('control not')[0];
    let hasNot = notP.querySelector('input').hasAttribute('checked');
    let field = getField(curCond);
    let key = id + "_" + field;
    let operator = getOperator(curCond);
    let term = getTerm(curCond, operator);

    let condStat = {};
    condStat[key] = term;
    let curQuery = {};
    curQuery[operator] = condStat;
    if (hasNot) {
        let res = {};
        res.NOT = curQuery;
        return res;
    }
    return curQuery;
}

function getFilters() {
    let logic = '';
    for (let id of [ 'courses-conditiontype-all', 'courses-conditiontype-any', 'courses-conditiontype-none' ]) {
        let cur = document.getElementById(id);
        if (cur.hasAttribute('checked')) {
            logic = cur.getAttribute('value');
            break;
        }
    }
    // (1) no condition used
    if (logic === 'none') {
        return {};
    }
    logic = logic === 'all' ? 'AND' : 'OR';

    let filters = [];
    let allConds = document.getElementsByClassName('conditions-container')[0];
    for (let curCond of allConds.querySelectorAll('div')) {
        if (curCond.getAttribute('class') === 'control-group condition') {
            filters.push(getFilter(curCond));
        }
    }
    // (2) no condition
    if (filters.length === 0) {
        return {};
    }
    // (3) only one condition, do not use logic
    if (filters.length === 1) {
        return filters[0];
    }
    // (4) otherwise
    let res = {};
    res[logic] = filters;
    return res;
}


// ** Retrieve option info
function getOrdKeys(keyP) {
    let keys = [];
    for (let key of keyP) {
        if (key.hasAttribute('selected')) {
            keys.push(id + "_" + key.getAttribute('value'));
        }
    }
    return keys;
}

function getOrder() {
    let ordP = document.getElementsByClassName('form-group order')[0];
    let keys = getOrdKeys(ordP.querySelectorAll('option'));
    // (i) no keys
    if (keys.length === 0) {
        return null;
    }
    // (ii) one key
    if (keys.length === 1) {
        return keys[0];
    }
    // (iii) multiple keys
    let res = {};
    let descdP = ordP.getElementsByClassName('control descending')[0];
    let descdCb = descdP.querySelector('input');
    res.dir = descdCb.hasAttribute('checked') ? 'DOWN' : 'UP';
    res.keys = keys;
    return res;
}

function getColumns() {
    let cols = [];
    let colsP = document.getElementsByClassName('form-group columns')[0];
    // let allCols = colsP.getElementsByClassName('control-field')[0];
    for (let key of colsP.querySelectorAll('input')) {
        if (key.hasAttribute('checked')) {
            let val = key.getAttribute('value');
            cols.push(id + "_" + val);
        }
    }
    return cols;
}

function getOptions() {
    let res = {};
    res.COLUMNS = getColumns();
    let sort = getOrder();
    if (sort !== null) {
        res.SORT = sort;
    }
    let ord = getOrder();
    if (ord !== null) {
        res.SORT = ord;
    }
    return res;
}


// ** Get transformations
function getTransTerm(ruleP) {
    let termP = ruleP.getElementsByClassName('control term')[0];
    return termP.querySelector('input').getAttribute('value');
}

function getToken(ruleP) {
    let tokenP = ruleP.getElementsByClassName('control operators')[0];
    for (let token of tokenP.querySelectorAll('option')) {
        if (token.hasAttribute('selected')) {
            return token.getAttribute('value');
        }
    }
}

function getTransField(ruleP) {
    let fieldP = ruleP.getElementsByClassName('control fields')[0];
    for (let rule of fieldP.querySelectorAll('option')) {
        if (rule.hasAttribute('selected')) {
            return rule.getAttribute('value');
        }
    }
}

function getApplyRule(ruleP) {
    let res = {};
    let body = {};
    body[getToken(ruleP)] = getTransField(ruleP);
    res[getTransTerm(ruleP)] = body;
    return res;
}

function getApply() {
    let res = [];
    let transPs = document.getElementsByClassName('control-group transformation');
    for (let ruleP of transPs) {
        res.push(getApplyRule(ruleP));
    }
    return res;
}

function getGroup() {
    let res = [];
    let colsP = document.getElementsByClassName('form-group groups')[0];
    // let allCols = colsP.getElementsByClassName('control-field')[0];
    for (let key of colsP.querySelectorAll('input')) {
        if (key.hasAttribute('checked')) {
            let val = key.getAttribute('value');
            res.push(id + "_" + val);
        }
    }
    return res.length === 0 ? null : res;
}

function getTrans() {
    let res = {};
    let group = getGroup();
    let apply = getApply();
    if (group === null && apply === null) {
        return null;
    }
    res.GROUP = group;
    res.APPLY = apply;
    return res;
}
