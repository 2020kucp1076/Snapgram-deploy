import {INewPost, INewUser, IUpdatePost, IUpdateUser} from "@/types";
import {ID, ImageGravity, Query} from 'appwrite';
import { account, appwriteConfig, avatars, databases, storage } from "./config";
import { redirect } from "react-router-dom";

export async function createUserAccount(user: INewUser){
    try{
        const newAccount = await account.create(
            ID.unique(),
            user.email,
            user.password,
            user.name
        )

        if(!newAccount) throw Error;

        const avatarUrl = avatars.getInitials(user.name);

        const newUser = await saveUserToDB({
            accountId:newAccount.$id,
            name:newAccount.name,
            email:newAccount.email,
            username:user.username,
            imageUrl: avatarUrl, 
        });

        return newUser;
    } catch(error){
        console.error(error)
        return error;
    }
}

export async function saveUserToDB(user:{
    accountId: string;
    name: string;
    email: string;
    username?: string;
    imageUrl: string;
}){
    try{
        const newUser = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            user,
        )

        return newUser;
    } catch(error){
        console.log(error);
    }
}

export async function signInAccount(user:{ email:string; password:string;}){
    try{
       const session = await account.createEmailPasswordSession(user.email, user.password);
       return session;
    } catch(error){
        console.error(error);
    }
}

export async function getCurrentUser(){
    try{
        const currentAccount = await account.get();

        if(!currentAccount) throw Error;

        const currentUser = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [Query.equal('accountId', currentAccount.$id)]
        )

        if(!currentUser) throw Error;

        return currentUser.documents[0];
    } catch (error){
        console.log(error);
    }
}



export async function signOutAccount(){
    try{
        const session = await account.deleteSession('current');
        redirect('/signin');
        return session;
    } catch(error){
        console.error(error);
    }
}

export async function createPost(post:INewPost){
    try{
        const uploadedFile = await uploadFile(post.file[0]);
        
        if(!uploadedFile) throw Error;

        const fileUrl = getFilePreview(uploadedFile.$id);
    
        if(!fileUrl) {
            deleteFile(uploadedFile.$id);
            throw new Error("File upload failed, please try again");
            
        }

        const tags = post.tags?.replace(/ /g, '').split(',') || [];

        const newPost = databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            ID.unique(),
            {
                creator:post.userId,
                caption:post.caption,
                imageUrl:fileUrl,
                imageId:uploadedFile.$id,
                location:post.location,
                tags:tags
            }
        )
    
        if(!newPost){
            await deleteFile(uploadedFile.$id);
            throw Error;
        }

        return newPost;
    } catch(error){
        console.log(error);
    }
}

export async function uploadFile(file:File){
    try{
        const uploadedFile = await storage.createFile(
            appwriteConfig.storageId,
            ID.unique(),
            file
        )
        return uploadedFile;
    } catch(error){
        console.error(error);
    }
}

export function getFilePreview(fileId:string){
    try {
        const fileUrl = storage.getFilePreview(
            appwriteConfig.storageId,
            fileId,
            2000,
            2000,
            ImageGravity.Top,
            100
        )

        return fileUrl;

    } catch (error) {
        
    }
}

export async function deleteFile(fileId:string){
    try {
        await storage.deleteFile(appwriteConfig.storageId, fileId);
        return {status:'ok'};
    } catch (error) {
        console.log(error);
    }
}

export async function GetRecentPosts(){
    const posts = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.postCollectionId,
        [Query.orderDesc(`$createdAt`), Query.limit(20)]
    )
    
    if(!posts) throw Error;
    
    return posts;
    
}

export async function likePost(postId:string, likesArray:string[]){
    try {
        const updatedPost = await databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            postId,
            {
                likes:likesArray
            }
        )

        if(!updatedPost) throw Error;
        return updatedPost;
    } catch (error) {   
        console.log(error);
    }
}

export async function savePost(postId:string, userId:string){
    try {
        const updatedPost = await databases.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.savesCollectionId,
            ID.unique(),
            {
                user:userId,
                post:postId
            }
        )

        if(!updatedPost) throw Error;
        return updatedPost;
    } catch (error) {   
        console.log(error);
    }
}

export async function deleteSavedPost(savedRecordId:string){
    try {
        const statusCode = await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.savesCollectionId,
            savedRecordId
        )

        if(!statusCode) throw Error;
        return {status:'ok'};
    } catch (error) {   
        console.log(error);
    }
}

export async function getPostById(postId:string){
    try {
        const post = await databases.getDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            postId
        )

        if(!post) throw Error;

        return post;
    } catch (error) {
        console.log(error);
    }
}

export async function updatePost(post:IUpdatePost){
    
    const hasFileToUpdate = post.file.length>0;

    try{    

        let image = {
            imageUrl: post.imageUrl.toString(),
            imageId: post.imageId
        }

        if(hasFileToUpdate){
            const uploadedFile = await uploadFile(post.file[0]);
            
            if(!uploadedFile) throw Error;
            
            const fileUrl = getFilePreview(uploadedFile.$id);
        
            if(!fileUrl) {
                deleteFile(uploadedFile.$id);
                throw Error;
            }

            image = {
                ...image, imageUrl:fileUrl, imageId:uploadedFile.$id
            }
        }

        const tags = post.tags?.replace(/ /g, '').split(',') || [];

        const updatedPost = databases.updateDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            post.postId,
            {
                caption:post.caption,
                imageUrl:image.imageUrl,
                imageId:image.imageId,
                location:post.location,
                tags:tags
            }
        )
    
        if(!updatedPost){
            await deleteFile(image.imageId);
            throw Error;
        }

        return updatedPost;
    } catch(error){
        console.log(error);
    }
}

export async function deletePost(postId:string, imageId:string){
    if(!postId) throw Error;

    try{
        await databases.deleteDocument(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            postId
        )

        await deleteFile(imageId);
        
        return {status:'ok'};
    }
    catch(error){
        console.log(error);
    }

}

export async function getInfinitePosts({pageParam}:{pageParam:number}){
    const queries = [Query.orderDesc('$updatedAt'),Query.limit(10)]

    if(pageParam){
        queries.push(Query.cursorAfter(pageParam.toString()));
    }

    try{
        const posts = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            queries
        )

        if(!posts) throw Error;
        
        return posts;
    } catch(error){
        console.log(error);
    }
}

export async function searchPosts(searchTerm:string){

    try{
        const posts = await databases.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.postCollectionId,
            [Query.search('caption' ,searchTerm)]
        )

        if(!posts) throw Error;
        return posts;
    } catch(error){
        console.log(error);
    }
}

export async function getUsers(limit?: number) {
    const queries: any[] = [Query.orderDesc("$createdAt")];
  
    if (limit) {
      queries.push(Query.limit(limit));
    }
  
    try {
      const users = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        queries
      );
  
      if (!users) throw Error;
  
      return users;
    } catch (error) {
      console.log(error);
    }
}

export async function getUserById(userId: string) {
    try {
      const user = await databases.getDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        userId
      );
  
      if (!user) throw Error;
  
      return user;
    } catch (error) {
      console.log(error);
    }
}

export async function updateUser(user: IUpdateUser) {
    const hasFileToUpdate = user.file.length > 0;
    try {
      let image = {
        imageUrl: user.imageUrl,
        imageId: user.imageId,
      };
  
      if (hasFileToUpdate) {
        const uploadedFile = await uploadFile(user.file[0]);
        if (!uploadedFile) throw Error;
  
        const fileUrl = getFilePreview(uploadedFile.$id);
        if (!fileUrl) {
          await deleteFile(uploadedFile.$id);
          throw Error;
        }
  
        image = { ...image, imageUrl: fileUrl, imageId: uploadedFile.$id };
      }
  
    
      const updatedUser = await databases.updateDocument(
        appwriteConfig.databaseId,
        appwriteConfig.userCollectionId,
        user.userId,
        {
          name: user.name,
          bio: user.bio,
          imageUrl: image.imageUrl,
          imageId: image.imageId,
        }
      );
  
      if (!updatedUser) {
        if (hasFileToUpdate) {
          await deleteFile(image.imageId);
        }

        throw Error;
      }
  
      if (user.imageId && hasFileToUpdate) {
        await deleteFile(user.imageId);
      }
  
      return updatedUser;
    } catch (error) {
      console.log(error);
    }
  }

  export async function getTopCreators() {
    const users = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.orderDesc("$createdAt"), Query.limit(20)]
    );
  
    if (!users) throw Error;
    return users;
  }