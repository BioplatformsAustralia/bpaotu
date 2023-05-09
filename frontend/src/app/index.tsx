import React, { useEffect, useCallback } from 'react'
import { connect } from 'react-redux'
import { Link, withRouter } from 'react-router-dom'
import { bindActionCreators } from 'redux'

import CookieConsent, { getCookieConsentValue } from 'react-cookie-consent'
import { apiCookieConsentAccepted, apiCookieConsentDeclined } from 'api'
import { pluginsList, triggerHashedIdentify } from 'app/analytics'
import { useAnalytics } from 'use-analytics'

import Header from './header'
import Footer from './footer'
import Routes from './routes'

import AustralianMicrobiomeAccessRequiredPage from 'pages/australian_microbiome_access_required_page'
import LoginInProgressPage from 'pages/login_in_progress_page'
import LoginRequiredPage from 'pages/login_required_page'

import { getCKANAuthInfo } from 'reducers/auth'

const App = (props) => {
  const { identify, page, plugins } = useAnalytics()

  const { auth, getCKANAuthInfo: getCKANAuthInfo_props } = props

  const enableCookies = useCallback(() => {
    plugins.enable(pluginsList)

    if (auth.email) {
      // trigger an identify when cookies are enabled (new user sessions)
      // need to check if email has been loaded from the auth headers since on page load it might not yet be available
      // this primarily is to send an identify after user first clicks Accept to cookie consent banner
      // (for which the email will have been retrieved)
      triggerHashedIdentify(identify, auth.email)
    }
  }, [identify, plugins, auth])

  useEffect(() => {
    getCKANAuthInfo_props()
  }, [getCKANAuthInfo_props])

  useEffect(() => {
    // important to note that cookie stores a string value of true or false
    const priorConsent = getCookieConsentValue() === 'true'
    if (priorConsent) {
      enableCookies()
    }
  }, [enableCookies])

  const enableCookiesAsync = async () => {
    enableCookies()
  }

  const cookieConsentAccepted = () => {
    apiCookieConsentAccepted()
    enableCookiesAsync().then(() => {
      // make a page() to record the initial page visit
      // even in a promise a decent delay is still required for page() to register
      setTimeout(page, 500)
    })
  }

  const cookieConsentDeclined = () => {
    apiCookieConsentDeclined()
  }

  const renderContents = () => {
    if (auth.isLoginInProgress) {
      return <LoginInProgressPage />
    }
    if (!auth.isLoggedIn) {
      return <LoginRequiredPage />
    }
    if (!auth.organisations.includes('australian-microbiome')) {
      return <AustralianMicrobiomeAccessRequiredPage />
    }

    return <Routes />
  }

  return (
    <div>
      <Header userEmailAddress={props.auth.email} />
      {renderContents()}
      <Footer />

      <CookieConsent
        location="bottom"
        cookieName="CookieConsent"
        style={{ background: '#2B373B' }}
        buttonText="Accept"
        declineButtonText="Decline"
        enableDeclineButton
        onAccept={() => {
          cookieConsentAccepted()
        }}
        onDecline={() => {
          cookieConsentDeclined()
        }}
      >
        <div>
          This website uses cookies to enhance the user experience and provide us with analytics on
          the usage of the features we provide.
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
