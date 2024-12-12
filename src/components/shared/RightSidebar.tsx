import { useLocation } from "react-router-dom";
import TopCreators from "./TopCreators";
import { useGetTopCreators } from "@/lib/react-query/queriesAndMutations";
import { Models } from "appwrite";

const RightSidebar = () => {

    const { pathname } = useLocation();
    if (pathname !== "/") return null;
  
    const { data: creators, isPending: isCreatorsLoading } = useGetTopCreators();
    if(isCreatorsLoading) return null;
    
    return (
        <nav className="rightsidebar custom-scrollbar">
          <h2 className="h3-bold md:h2-bold w-full mb-10">Top Creators</h2>
          <div className="grid xl:grid-cols-2 lg:grid-cols-1 gap-4">
            {creators?.documents.map((creator: Models.Document) => (
              <TopCreators key={creator.$id} creator={creator} />
            ))}
          </div>
        </nav>
    )
}

export default RightSidebar