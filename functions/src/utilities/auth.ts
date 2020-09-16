import { Request } from "firebase-functions/lib/providers/https";

export const getBearerToken = (req: Request) => {
    let token = null;
    const authHeader = req.get("authorization");
  
    if (authHeader) {
      const splited = authHeader.split("Bearer ");
      token = splited.length > 0 ? splited[1] : null;
    }
    
    return token;
}
  