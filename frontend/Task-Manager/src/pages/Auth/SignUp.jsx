import React, { useState } from 'react'
import AuthLayout from '../../components/AuthLayout'

function SignUp() {

  const [profilePic, setProfilePic]=useState(null);
  const [fullName, setFullName]=useState("");
  const [email, setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [adminInviteToken,setAdminInviteToken]=useState("");

  const [error,setError]=useState(null);

  

  return (
    <AuthLayout>
      <div className='lg:w-[100%] h-auto md:h-full mt-10 md:mt-0 flex flex-col justify-center'>
        <h3>Create an Account</h3>
        <p>
          Join us today by entering your details below.
        </p>
      </div>
    </AuthLayout>
     
  )
}

export default SignUp
