import * as React from 'react'
import { connect } from 'react-redux'
import { Link, withRouter } from 'react-router-dom'
import { bindActionCreators } from 'redux'

import CookieConsent, { getCookieConsentValue } from 'react-cookie-consent'
import analytics, { pluginsList, triggerHashedIdentify } from 'app/analytics'

import Header from './header'
import Footer from './footer'
import Routes from './routes'

import AustralianMicrobiomeAccessRequiredPage from 'pages/australian_microbiome_access_required_page'
import LoginInProgressPage from 'pages/login_in_progress_page'
import LoginRequiredPage from 'pages/login_required_page'

import { getCKANAuthInfo } from 'reducers/auth'

class App extends React.Component<any> {
  public componentDidMount() {
    this.props.getCKANAuthInfo()

    // important to note that cookie stores a string value of true or false
    const priorConsent = getCookieConsentValue() === 'true'
    if (priorConsent) {
      this.enableCookies()
    }
  }

  public enableCookies() {
    analytics.plugins.enable(pluginsList)

    // trigger an identify when cookies are enabled (new user sessions)
    // need to check if email has been loaded from the auth headers since on page load it might not yet be available
    // this primarily is to send an identify after user first clicks Accept to cookie consent banner
    // (for which the email will have been retrieved)
    if (this.props.auth.email) {
      triggerHashedIdentify(this.props.auth.email)
    }
  }

  public render() {
    return (
      <div>
        <Header userEmailAddress={this.props.auth.email} />
        {this.renderContents()}
        <Footer />

        {/* TODO
        Port the footer into React as well. Currently it is provided by the base.html Django template.
        What is preventing porting it for now is the wrapping logic. Check .content-div in bpaotu.css for more details.
         */}

        <CookieConsent
          location="bottom"
          cookieName="CookieConsent"
          style={{ background: '#2B373B' }}
          buttonText="Accept"
          declineButtonText="Decline"
          enableDeclineButton
          onAccept={() => {
            this.enableCookies()
          }}
        >
          <div>
            This website uses cookies to enhance the user experience and provide us with analytics
            on the usage of the features we provide.
            <br />
            <span style={{ fontSize: '10px', marginLeft: '4px' }}>
              We <strong>do not</strong> send any personally identifyable information to external
              services. Please see our <Link to={'privacy-policy'}>privacy policy</Link> for more
              details.
            </span>
          </div>
        </CookieConsent>
      </div>
    )
  }

  public renderContents() {
    if (this.props.auth.isLoginInProgress) {
      return <LoginInProgressPage />
    }
    if (!this.props.auth.isLoggedIn) {
      return <LoginRequiredPage />
    }
    if (!this.props.auth.organisations.includes('australian-microbiome')) {
      return <AustralianMicrobiomeAccessRequiredPage />
    }

    return <Routes />
  }
}

function mapStateToProps(state) {
  return {
    auth: state.auth,
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      getCKANAuthInfo,
    },
    dispatch
  )
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(App) as any)
