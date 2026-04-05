import { Protect, useClerk, useUser } from "@clerk/clerk-react";
import {
  Eraser,
  FileText,
  Hash,
  House,
  Icon,
  Image,
  LogOut,
  Scissors,
  SquarePen,
  User,
  Users,
} from "lucide-react";
import React from "react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/ai", label: "Dashboard", Icon: House },
  { to: "/ai/write-article", label: "Write Article", Icon: SquarePen }, // <-- UPDATED PATH
  { to: "/ai/blog-titles", label: "Blog Titles", Icon: Hash }, // <-- UPDATED PATH
  { to: "/ai/generate-images", label: "Generate Images", Icon: Image }, // <-- UPDATED PATH
  { to: "/ai/remove-background", label: "Remove Background", Icon: Eraser }, // <-- UPDATED PATH
  { to: "/ai/remove-object", label: "Remove Object", Icon: Scissors }, // <-- UPDATED PATH
  { to: "/ai/review-resume", label: "Review resume ", Icon: FileText }, // <-- UPDATED PATH
  { to: "/ai/community", label: "Community", Icon: Users }, // <-- UPDATED PATH
];

const Sidebar = ({ sidebar, setSidebar }) => {
  const { user } = useUser();
  const { signOut,openUserProfile } = useClerk(); 
  return (
    <div
      className={`w-60 bg-white border-r border-gray-200 flex flex-col justify-between items-center max-sm:absolute top-14 bottom-0 ${
        sidebar ? "translate-x-0" : "max-sm:-translate-x-full"
      } transition-all duration-300 ease-in-out`}
    >
      <div className="my-7 w-full">
        <img
          src={user.imageUrl}
          alt="User Avtar"
          className="w-13 rounded-full mx-auto "
        />
        <h1 className="mt-1 text-center">{user.fullName}</h1>
        {/* Added spacing and fixed the map function */}
        <div className="mt-5 space-y-2 px-3">
          {navItems.map(
            (
              { to, label, Icon } // <-- FIX: Changed to implicit return ( ) and capitalized Icon
            ) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/ai"} // Only 'end' on the exact dashboard path
                onClick={() => setSidebar(false)}
                className={({ isActive }) =>
                  `px-3.5 py-2.5 flex items-center gap-3 rounded ${
                    isActive
                      ? "bg-gradient-to-r from-[#3C81F6] to-[#9234EA] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-white" : "text-gray-500"
                      }`}
                    />
                    {label}
                  </>
                )}
              </NavLink>
            )
          )}
        </div>

      </div>
      
      <div className="w-full border-t border-gray-200 p-4 px-7 flex items-center justify-between">
          <div onClick={openUserProfile} className="flex gap-2 items-center cursor-pointer">
            <img src={user.imageUrl} className="w-8 rounded-full" alt="" />
            <div>
                <h1 className="text-sm font-medium">{user.fullName}</h1>
                <p className="text-xs text-gray-500">
                    <Protect plan='premium' fallback="Free">Premium</Protect>
                    Plan
                </p>
            </div>
          </div>
          <LogOut onClick={signOut} className="w-4.5 text-gray-400 hover:text-gray-700 transition cursor-pointer"/>
      </div>
    </div>
  );
};

export default Sidebar;
// import { useClerk, useUser } from '@clerk/clerk-react'
// import { Eraser, FileText, Hash, House, Icon, Image, Scissors, SquarePen, User, Users } from 'lucide-react'
// import React from 'react'
// import { NavLink } from 'react-router-dom'
// const navItems =[
//     {to:'/ai', label:'Dashboard',Icon:House},
//     {to:'/write-article', label:'Write Article',Icon:SquarePen},
//     {to:'/blog-titles', label:'Blog Titles',Icon:Hash},
//     {to:'/generate-images', label:'Generate Images',Icon:Image},
//     {to:'/remove-background', label:'Remove Background',Icon:Eraser},
//     {to:'/remove-object', label:'Remove Object',Icon:Scissors},
//     {to:'/review-resume', label:'Review resume ',Icon:FileText},
//     {to:'/Community', label:'Community',Icon:Users}
// ]
// const Sidebar = ({sidebar,setSidebar}) => {
//     const {user} = useUser()
//     const {signOut,openUserProfile} = useClerk()
//   return (
//     <div className={`w-60 bg-white border-r border-gray-200 flex flex-col justify-between items-center max-sm:absolute top-14 bottom-0 ${sidebar ?'translate-x-0' :'max-sm:-translate-x-full'} transition-all duration-300 ease-in-out`}>
//         <div className='my-7 w-full'>
//             <img src={user.imageUrl} alt="User Avtar"  className='w-13 rounded-full mx-auto '/>
//             <h1 className='mt-1 text-center'>{user.fullName}</h1>
//             <div>
//                 {navItems.map(({to,label,icon})=>{
//                     <NavLink key={to} to={to} end={to=='/ai'} onClick={()=> setSidebar(false) } className={({isActive})=>`px-3.5 py-2.5 flex items-center gap-3 rounded ${isActive? 'bg-gradient-to-r from-[#3C81F6] to-[#9234EA] text-white':''}`}>
//                         {(isActive)=>(
//                             <>
//                             <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`}/>
//                             {label}
//                             </>

//                         )}
//                     </NavLink>
//                 })}
//             </div>
//         </div>

//     </div>
//   )
// }

// export default Sidebar
