//import { useState } from "react";
import { NavBar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import "../styles/Profile.css"

//TODO: Eventually gate this screen to only be available for logged in Users
//Once that is done, remove the link to /Profile in Navbar
export default function Profile() {
/* WIP for when backend is implemented

    const [loading, setLoading] = useState(true);

    return (
       <div className="profile">
            {loading ? (
                ...
            ) : error ? (
                ...
            ) : (
                <main className="profile">
                    <NavBar />
                    <div className="profile">
                        <h1>Username</h1>
                    </div>
                </main>
        </div> 
    );    
*/
    return (
        <>
            <NavBar />
            <main className="profile">
                <div className="profile-page">
                    <div className="profile-container">
                        <img className="profile-pic" src="https://i.pinimg.com/236x/dd/f0/11/ddf0110aa19f445687b737679eec9cb2.jpg"></img>
                        <button className="change-pic-button">Change Profile Picture</button>
                        <h1 className="profile-name">Username</h1>
                        <h2 className="profile-sales">14 Total Sales</h2>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
};