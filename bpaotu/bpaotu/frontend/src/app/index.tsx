import * as React from 'react'
import { hot } from 'react-hot-loader'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { bindActionCreators } from 'redux'

import Header from './header'
import Routes from './routes'

import LoginInProgressPage from '../pages/login_in_progress_page'
import LoginRequiredPage from '../pages/login_required_page'

import { getCKANAuthInfo } from '../reducers/auth'

class App extends React.Component<any> {
  public componentWillMount() {
    if (window.otu_search_config.ckan_auth_integration) {
      this.props.getCKANAuthInfo()
    }
  }

  public render() {
    return (
      <div>
        <Header userEmailAddress={this.props.auth.email} />
        {this.renderContents()}

        {/* TODO
        Port the footer into React as well. Currently it is provided by the base.html Django template.
        What is preventing porting it for now is the wrapping logic. Check .content-div in bpaotu.css for more details.
        <Footer /> */}
      </div>
    )
  }

  public renderContents() {
    if (window.otu_search_config.ckan_auth_integration) {
      if (this.props.auth.isLoginInProgress) {
        return <LoginInProgressPage />
      }
      if (!this.props.auth.isLoggedIn) {
        return <LoginRequiredPage />
      }
    }
    return <Routes />
  }
}

function mapStateToProps(state) {
  return {
    auth: state.auth
  }
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators(
    {
      getCKANAuthInfo
    },
    dispatch
  )
}

export default hot(module)(
  withRouter(connect(
    mapStateToProps,
    mapDispatchToProps
  )(App) as any)
)
