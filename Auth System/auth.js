import loginFxn from "./login";
import signUpFxn from "./signup";

// When lambda is triggered by Api Gateway, AWS passes an event with it that contains info about request
const authHandler = async(event) => {
    try {
        const path = event.path
        console.log(path);
        
        const body = event.body ? JSON.parse(event.body) : {}   // without express, we need to manually convert

        if(path === '/signup'){
            return await signUpFxn(body)
        }else if(path === '/login'){
            return await loginFxn(body)
        }else{
            return { statusCode: 404, body: JSON.stringify({message: "Invalid path"}) }
        }
    } catch (error) {
        console.error(error)
        return { statusCode: 500, body: JSON.stringify({message: "Internal server error"}) }
    }
}

export default authHandler
