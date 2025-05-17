import React, { useCallback, useContext, useState } from 'react'
import AuthLayout from '../../components/AuthLayout'
import ProfilePhotoSelector from '../../components/Inputs/ProfilePhotoSelector';
import Input from '../../components/Inputs/Input';

import { validateEmail } from '../../utils/helper';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { API_PATHS } from '../../utils/apiPaths';
import { UserContext } from '../../context/userContext';
import uploadImage from '../../utils/uploadImage';

function SignUp() {

  const [profilePic, setProfilePic]=useState(null);
  const [fullName, setFullName]=useState("");
  const [email, setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [adminInviteToken,setAdminInviteToken]=useState("");
  const {updateUser}=useContext(UserContext);
  const Navigate=useNavigate();

  const [error,setError]=useState(null);

  const handleSignUp=async(e)=>{
    e.preventDefault();

    let profileImageUrl=''

    if(!fullName){
      setError("Please Enter Full Name.")
      return;

    }
    if(!validateEmail(email)){
      setError("Please Enter a valid Email Address")
      return;
    }
    if(!password){
      setError("Please enter the password.")
    }
    setError("")

    // SIgnUp api call
    try{

      if(profilePic){
        const imgUploadRes=await uploadImage(profilePic);
        console.log("Image upload response:", imgUploadRes);
        profileImageUrl=imgUploadRes.imageUrl || "";
      }

      const response=await axiosInstance.post(API_PATHS.AUTH.REGISTER,{
        name:fullName,
        email,
        password,
        profileImageUrl,
        adminInviteToken
      });


      const {token,role}=response.data;
      if(token){
          localStorage.setItem("token",token);
          updateUser(response.data)
          if(role==='admin'){
            Navigate("/admin/dashboard");   
          }else{
            Navigate("/user/dashboard")
          }
      }

    }catch(error){
      if(error.response && error.response.data.message){
        setError(error.response.data.message)
      }else{
        setError("Something Went wrong. Please try again.")
      }
    }

  };
 
  

  return (
    <AuthLayout>
      <div className='lg:w-[100%] h-auto md:h-full mt-10 md:mt-0 flex flex-col justify-center'>
        <h3>Create an Account</h3>
        <p>
          Join us today by entering your details below.
        </p>

        <form onSubmit={handleSignUp}>
          <ProfilePhotoSelector image={profilePic} setImage={setProfilePic}/>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>

            <Input
              value={fullName}
              onChange={({target})=>setFullName(target.value)}
              label='Full Name'
              placeholder='Jhon'
              type='text'
            /> 

            <Input
            value={email}
            onChange={({ target }) => setEmail(target.value)}
            label="Email Address"
            placeholder="john@example.com"
            type="text"
          />

          <Input
            value={password}
            onChange={({ target }) => setPassword(target.value)}
            label="Password"
            placeholder="Min 8 characters"
            type="password"
          />

          <Input
            value={adminInviteToken}
            onChange={({ target }) => setAdminInviteToken(target.value)}
            label="Admin Invite Token"
            placeholder="6 Digit Code"
            type="text"
          />
        </div>
          {error && <p className="text-red-500 text-xs pb-2.5">{error}</p>}

          <button type="submit" className="btn-primary">
            SIGN UP
          </button>

          <p className="text-[13px] text-slate-800 mt-3">
            Already have an account?{" "}
            <Link className="font-medium text-primary underline" to="/login">
              Login
            </Link>
          </p>
 

          
        </form>

      </div>
    </AuthLayout>
     
  )
}

export default SignUp
