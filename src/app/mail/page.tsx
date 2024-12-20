import React from 'react'
import Mail from './Mail'

const MailDashboard = () => {
  return (
    <div>
      <Mail
        defaultLayout={ [ 20, 32, 48 ] }
        defaultCollapsed={ false }
        navCollapsedSize={4}
      />
    </div>
  )
}

export default MailDashboard