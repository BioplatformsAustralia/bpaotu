import React, { useEffect } from 'react'
import { Container } from 'reactstrap'

import { useAnalytics } from 'use-analytics'

const PrivacyPolicyPage = () => {
  const { page } = useAnalytics()

  // track page visit only on first render
  useEffect(() => {
    page()
  }, [page])

  return (
    <Container fluid={true} style={{ marginTop: 10, width: '50%' }}>
      <h2>PRIVACY POLICY</h2>

      <p>Last updated March 28, 2023</p>

      <p>
        This privacy notice for the Bioplatforms OTU Search Facility ('we', 'us', or 'our'),
        describes how and why we might collect, store, use, and/or share ('process') your
        information when you use our services ('Services'), such as when you:
      </p>

      <ul>
        <li>
          Visit our website at https://data.bioplatforms.com/bpa/otu, or any website of ours that
          links to this privacy notice
        </li>
        <li>Engage with us in other related ways, including any data requests</li>
      </ul>

      <p>
        Questions or concerns? Reading this privacy notice will help you understand your privacy
        rights and choices. If you do not agree with our policies and practices, please do not use
        our Services. If you still have any questions or concerns, please contact us at
        help@bioplatforms.com.
      </p>

      <p>
        Please note that the Bioplatforms OTU Search Facility is hosted on the Bioplatforms
        Australia Data Portal and is covered by the Terms and Conditions and Privacy Policy defined
        at https://bioplatforms.com/terms-and-conditions/. This Privacy Policy covers additional
        points specific to the Bioplatforms OTU Search Facility.
      </p>

      <h4>SUMMARY OF KEY POINTS</h4>

      <p>
        This summary provides key points from our privacy notice, but you can find out more details
        about any of these topics by clicking the link following each key point or by using our
        table of contents below to find the section you are looking for.
      </p>

      <p>
        <strong>What personal information do we process?</strong> When you visit, use, or navigate
        our Services, we may process personal information depending on how you interact with
        Bioplatforms OTU Search Facility and the Services, the choices you make, and the features
        you use.
      </p>

      <p>
        <strong>Do we process any sensitive personal information?</strong> We do not process
        sensitive personal information.
      </p>

      <p>
        <strong>Do we receive any information from third parties?</strong> We do not receive any
        information from third parties.
      </p>

      <p>
        <strong>How do we process your information?</strong> We process your information to provide,
        improve, and administer our Services, communicate with you, for security and fraud
        prevention, and to comply with law. Any personal information we process is anonymised before
        being used. This means that no personally identifying information is shared with external
        parties. We process your information only when we have a valid legal reason to do so.
      </p>

      <p>
        <strong>In what situations and with which parties do we share personal information?</strong>{' '}
        We do not share and personally identifying information with third parties. Learn more about
        when and with whom we share your personal information.
      </p>

      <h4>TABLE OF CONTENTS</h4>

      <p>1. WHAT INFORMATION DO WE COLLECT?</p>
      <p>2. HOW DO WE PROCESS YOUR INFORMATION?</p>
      <p>3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</p>
      <p>4. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</p>
      <p>5. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</p>

      <h5>1. WHAT INFORMATION DO WE COLLECT?</h5>

      <p>In Short: We collect personal information that you provide to us.</p>

      <p>
        We collect personal information that you voluntarily provide to us when you register on the
        Services, express an interest in obtaining information about us or our products and
        Services, when you participate in activities on the Services, or otherwise when you contact
        us.
      </p>

      <p>
        We automatically collect certain information when you visit, use, or navigate the Services.
        This information does not reveal your specific identity (like your name or contact
        information) but may include device and usage information, such as your IP address, browser
        and device characteristics, operating system, language preferences, referring URLs, device
        name, country, location, information about how and when you use our Services, and other
        technical information. This information is primarily needed to maintain the security and
        operation of our Services, and for our internal analytics and reporting purposes.
      </p>

      <p>
        Like many businesses, we also collect information through cookies and similar technologies.
      </p>

      <p>The information we collect includes:</p>

      <ul>
        <li>
          Log and Usage Data. Log and usage data is service-related, diagnostic, usage, and
          performance information our servers automatically collect when you access or use our
          Services and which we record in log files. Depending on how you interact with us, this log
          data may include your IP address, device information, browser type, and settings and
          information about your activity in the Services (such as the date/time stamps associated
          with your usage, pages and files viewed, searches, and other actions you take such as
          which features you use), device event information (such as system activity, error reports
          (sometimes called 'crash dumps'), and hardware settings).
        </li>
        <li>
          Device Data. We collect device data such as information about your computer, phone,
          tablet, or other device you use to access the Services. Depending on the device used, this
          device data may include information such as your IP address (or proxy server), device and
          application identification numbers, location, browser type, hardware model, Internet
          service provider and/or mobile carrier, operating system, and system configuration
          information.
        </li>
        <li>
          Location Data. We collect location data such as information about your device's location,
          which can be either precise or imprecise. How much information we collect depends on the
          type and settings of the device you use to access the Services. For example, we may use
          GPS and other technologies to collect geolocation data that tells us your current location
          (based on your IP address). You can opt out of allowing us to collect this information
          either by refusing access to the information or by disabling your Location setting on your
          device. However, if you choose to opt out, you may not be able to use certain aspects of
          the Services.
        </li>
      </ul>

      <h5>2. HOW DO WE PROCESS YOUR INFORMATION?</h5>

      <p>
        We process your information to provide, improve, and administer our Services, communicate
        with you, for security and fraud prevention, and to comply with law. We may also process
        your information for other purposes with your consent.
      </p>

      <p>
        We process your personal information for a variety of reasons, depending on how you interact
        with our Services, including:
      </p>

      <ul>
        <li>
          To identify usage trends. We may process information about how you use our Services to
          better understand how they are being used so we can improve them.
        </li>
        <li>
          To save or protect an individual's vital interest. We may process your information when
          necessary to save or protect an individual’s vital interest, such as to prevent harm.
        </li>
      </ul>

      <h5>3. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?</h5>

      <p>
        We do not share your peronsal information with any third parties. We do share anonymised
        information on site usage with third parties to aid us with the analysis of data on the
        Services we provide.
      </p>

      <h5>4. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?</h5>

      <p>
        In Short: We may use cookies and other tracking technologies to collect and store your
        information.
      </p>

      <p>
        We may use cookies and similar tracking technologies (like web beacons and pixels) to access
        or store information. Specific information about how we use such technologies and how you
        can refuse certain cookies is set out in our Cookie Policy.
      </p>

      <h5>5. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h5>

      <p>
        If you have questions or comments about this notice, you may email us at
        help@bioplatforms.com.
      </p>

      <h2>COOKIE POLICY</h2>

      <p>
        Please read this cookie policy (“cookie policy”, "policy") carefully before using
        Bioplatforms OTU Search Facility (“website”, "service") operated by Bioplatforms Australia
        ("us", 'we", "our").
      </p>

      <h5>What are cookies?</h5>

      <p>
        Cookies are simple text files that are stored on your computer or mobile device by a
        website’s server. Each cookie is unique to your web browser. It will contain some anonymous
        information such as a unique identifier, website’s domain name, and some digits and numbers.
      </p>

      <h5>What types of cookies do we use?</h5>

      <em>Necessary cookies</em>

      <p>
        Necessary cookies allow us to offer you the best possible experience when accessing and
        navigating through our website and using its features. For example, these cookies let us
        recognize that you have created an account and have logged into that account.
      </p>

      <em>Functionality cookies</em>

      <p>
        Functionality cookies let us operate the site in accordance with the choices you make. For
        example, we will recognize your username and remember how you customized the site during
        future visits.
      </p>

      <em>Analytical cookies</em>

      <p>
        These cookies enable us and third-party services to collect aggregated data for statistical
        purposes on how our visitors use the website. These cookies do not contain personal
        information such as names and email addresses and are used to help us improve your user
        experience of the website.
      </p>

      <h5>How to delete cookies?</h5>

      <p>
        If you want to restrict or block the cookies that are set by our website, you can do so
        through your browser setting. Alternatively, you can visit www.internetcookies.com, which
        contains comprehensive information on how to do this on a wide variety of browsers and
        devices. You will find general information about cookies and details on how to delete
        cookies from your device.
      </p>

      <h5>Contacting us</h5>

      <p>
        If you have any questions about this policy or our use of cookies, please contact us at
        help@bioplatforms.com.
      </p>
    </Container>
  )
}

export default PrivacyPolicyPage
