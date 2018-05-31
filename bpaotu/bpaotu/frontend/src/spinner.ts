import { Spinner, SpinnerOptions } from 'spin.js';
import 'spin.js/spin.css';


export function createSpinner(elementId: string) {
    let theSpinner: Spinner;
    const target = document.getElementById(elementId);

    const opts: SpinnerOptions = {
        lines: 15, // The number of lines to draw
        length: 14, // The length of each line
        width: 10, // The line thickness
        radius: 20, // The radius of the inner circle
        corners: 1, // Corner roundness (0..1)
        rotate: 60, // The rotation offset
        direction: 1, // 1: clockwise, -1: counterclockwise
        color: '#000', // #rgb or #rrggbb or array of colors
        speed: 2.2, // Rounds per second
        shadow: true, // Whether to render a shadow
        className: 'spinner', // The CSS class to assign to the spinner
        zIndex: 2e9, // The z-index (defaults to 2000000000)
        top: '50%', // Top position relative to parent
        left: '50%', // Left position relative to parent
    };

    function start() {
        if (theSpinner) {
            theSpinner.spin(target);
        } else {
            theSpinner = new Spinner(opts).spin(target);
        }
    }

    function stop() {
        if (theSpinner) {
            theSpinner.stop();
        } else {
            console.log('bum');
        }
    }

    return {start, stop}
}
