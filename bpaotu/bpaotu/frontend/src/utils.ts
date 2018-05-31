
export interface HTMLSelectOption {
    value: string,
    text: string
}

export function setOptions(target: JQuery, options: HTMLSelectOption[], addBlank=true) {
    const blankOption: HTMLSelectOption = {
        text: '----',
        value: null
    };
    target.empty();

    if (addBlank) {
        options = [blankOption, ...options];
    }
    $.each(options, function(index, option) {
        $('<option/>').val(option.value).text(option.text).appendTo(target);
    });
};