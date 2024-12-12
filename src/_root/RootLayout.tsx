import Bottombar from "@/components/shared/Bottombar"
import LeftSidebar from "@/components/shared/LeftSidebar"
import RightSidebar from "@/components/shared/RightSidebar"
import Topbar from "@/components/shared/Topbar"
import { Outlet } from "react-router-dom"

const RootLayout = () => {
  return (
    <div className="w-full md:flex">
      <Topbar></Topbar>
      <LeftSidebar></LeftSidebar>
      
      <section className="flex flex-1 h-full">
        <Outlet></Outlet>
      </section>
      <RightSidebar></RightSidebar>
      <Bottombar></Bottombar>
    </div>
  )
}

export default RootLayout