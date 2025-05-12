import React, { useState } from 'react'
import AuthLayout from '../../components/AuthLayout'
import Input from '../../components/Inputs/Input'

import {useNavigate} from 'react-router-dom'

const Login = () => {
  
  const [email,setEmail]=useState("");
  const [passqword,setPassword]=useState("");
  const [error,setError]=useState(null);


  const navigate=useNavigate();

  const handleLogin=async(e)=>{
    e.preventDefault();
  }

  return (
   <AuthLayout>

    <div className='lg:w-[70%] h-3/4 md:h-full flex flex-col justify-center'>
      <h3 className='text-xl fond-semibold text-black'> Welcome Back</h3>
      <p className='text-xs text-slate-700 mt-[5px] mb-6'>
        Please Enter your details to log in
      </p>

      <form onSubmit={handleLogin}>
        <Input
          value={email}
          onChange={({target})=>setEmail(target.email)}
          label='Email Address'
          placeholder='jhon@example.com'
          type='text'
        
        />
      </form>
    </div>
   </AuthLayout>
  )
}

export default Login
