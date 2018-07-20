import * as _ from 'lodash';

export const changeElementAtIndex = (arr, idx, fn) => {
    const changedElement = fn(arr[idx]);
    if (arr[idx] === changedElement) {
        return arr;
    }
    let result = arr.slice(0, idx);
    if (changedElement) {
        result.push(changedElement);
    }
    result = result.concat(arr.slice(idx + 1));
    return result;
}

export const removeElementAtIndex = _.partialRight(changeElementAtIndex, () => null);
