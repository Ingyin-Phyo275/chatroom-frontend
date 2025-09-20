import App from "@/App";
import Login from "@/features/Login/login";
import Register from "@/features/Register/register";
import { createBrowserRouter } from "react-router-dom";

const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login/>
    },
    {
        path: "/register",
        element: <Register/>
    },
    {
        path: "/",
        element: <App/>,
        children: [
            {
                path: "/",
                element: <App/>
            }
        ]
    }
]);

export default router;