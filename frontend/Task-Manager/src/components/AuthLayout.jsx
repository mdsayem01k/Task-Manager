import React from 'react'
import UI_IMG from '../assets/images/auth-image.jpg'


const AuthLayout = ({children}) => {
  return (
    <div className='flex h-screen'>
      <div className='w-1/2 px-12 pt-8 pb-12'>
          <h2 className='text-lg font-medium text-black'>Task Manager</h2>
          {children}
      </div>

      <div className='w-1/2 flex items-center justify-center bg-blue-50 bg-[url("../assets/images/bg-img.jpg")] bg-cover bg-no-repeat bg-center overflow-hidden p-8'>
          <img src={UI_IMG} alt="auth" className='w-64 lg:w-[90%]' />
      </div>
    </div>
  )
}

export default AuthLayout
