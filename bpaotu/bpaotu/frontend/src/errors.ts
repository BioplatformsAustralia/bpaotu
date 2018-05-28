import * as _ from 'lodash';
import * as $ from 'jquery';

// TODO Bootstrap alerts would be more appropriate - common for all pages

export class ErrorBox {
    private static errorsTemplate = _.template(`
    <h3>Error:</h3>
    <ul>
        <% _.forEach(errors, function(err) { %>
            <li><%- err %></li> 
        <% }); %> 
    </ul>`);
 
    private target: JQuery;

    constructor(targetSelector: string) {
        this.target = $(targetSelector);
    }

    display(errors: string[] = []) {
        this.target.empty();
        if (errors.length === 0) {
            this.target.hide();
            return;
        }
        this.target.append(ErrorBox.errorsTemplate({errors}));
        this.target.show();
    }
}