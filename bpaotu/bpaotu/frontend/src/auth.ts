
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
            loggedIn(authToken);
            setupGlobalAjax(authToken);
            resolve();
        }).catch(() => {
            $("#token_error_message").html(pleaseLogIn).toggle();
        });
    });
}

function getAuthToken() {
    // TODO clarify this CKAN_AUTH_INTEGRATION stuff with the others
    // is CKAN_AUTH_INTEGRATION always needed for the app to work properly
    // if possible to have an app without it should we downgrade the UI?
    // I would prefer to have a development only view returning a dummy token and email
    // instead of shortcutting the ckan_auth functions everywhere. This way dev would
    // be much closer to prod.

    return new Promise((resolve, reject) => {
        if (! window.otu_search_config['ckan_auth_integration']) {
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
            // TODO xhr.setRequestHeader("X-CSRFToken", csrftoken);
            xhr.setRequestHeader("X-BPAOTU-CKAN-Token", authToken);

            if (isUnsafeCSRFMethod(settings.type)) {
                xhr.setRequestHeader("X-CSRFToken", csrfToken);
            }
        }
    })
}

