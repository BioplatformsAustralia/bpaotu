
export function ckanAuth() {
    const pleaseLogIn = `<span class='error_text bg-warning'>
        <b>Login required: </b>
        Please log into the <a href='/user/login'>Bioplatforms Data Portal</a>,
        or <a href='/user/register'>request access</a>. 
        If you still cannot access the data after logging in, contact
        <a href='help@bioplatforms.com'>support</a>.
        </span>`;
        
    function loggedIn(authToken: string) {
        $("#token_error_message").hide();
        if (authToken === '') {
            return;
        }
        let data = $.parseJSON(authToken.split("||")[1]);
        $("#user_id").append(data.email + " | " + '<a href="/user/_logout">Sign Out</a>');
    }

    return new Promise((resolve, reject) => {
        getAuthToken().then((authToken: string) => {
            window.CKANAuthToken = authToken;
            loggedIn(authToken);
            setupGlobalAjax(authToken);
            resolve();
        }).catch(() => {
            $("#token_error_message").html(pleaseLogIn).toggle();
        });
    });
}

export function getAuthToken() {
    return new Promise((resolve, reject) => {
        if (! window.otu_search_config.ckan_auth_integration) {
            resolve('');
            return;
        }

        return $.ajax({ url: window.otu_search_config.ckan_check_permissions });
    });
}

function isUnsafeCSRFMethod(method: string) {
    // these HTTP methods do not require CSRF protection
    return !(/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

function setupGlobalAjax(authToken: string) {
    let csrfToken = jQuery("[name=csrfmiddlewaretoken]").val().toString();

    $.ajaxSetup({
        beforeSend: function(xhr: JQueryXHR, settings: JQueryAjaxSettings) {
            if (settings.crossDomain) return;
            xhr.setRequestHeader("X-BPAOTU-CKAN-Token", authToken);

            if (isUnsafeCSRFMethod(settings.type)) {
                xhr.setRequestHeader("X-CSRFToken", csrfToken);
            }
        }
    })
}

