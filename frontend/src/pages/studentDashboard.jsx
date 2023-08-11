import "./studentDashboard.css";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserInfo, signOut } from "../services/user";
import cmulogo from "../image/cmulogo.png";
import { Link } from "react-router-dom";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState([]);
  const [isHovered, setIsHovered] = useState(false); // Define isHovered state
  const [showSsSidebar, setShowSsSidebar] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const resp = await getUserInfo();
      if (!resp.ok) navigate("/sign-in");
      else setUserInfo(resp.userInfo);
    };

    fetchData();
  }, []);

  const toggleSsSidebar = () => {
    setShowSsSidebar((prev) => !prev);
  };

  return (
    <div className="p-3">
      <div className="StuDaNavBar">
        <div
          className="StuDaSidebar-icon"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={toggleSsSidebar}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="45"
            height="45"
            viewBox="0 0 256 256"
          >
            <g>
              {/* White background path for the border */}
              <path
                fill="#8084C8"
                d="M216 40H40a16 16 0 0 0-16 16v144a16 16 0 0 0 16 16h176a16 16 0 0 0 16-16V56a16 16 0 0 0-16-16Z"
              />
              {/* Original path with the icon */}
              <path
                fill={isHovered ? "black" : "white"}
                d="M216 40H40a16 16 0 0 0-16 16v144a16 16 0 0 0 16 16h176a16 16 0 0 0 16-16V56a16 16 0 0 0-16-16Zm0 160H88V56h128v144Z"
              />
            </g>
          </svg>
        </div>
        <img src={cmulogo} alt="CMULogo" className="StuDacmulogo" />
        {userInfo && userInfo.firstName && (
          <p className="StuDahellostyle">
            Hello, {userInfo.firstName.charAt(0).toUpperCase()}
            {userInfo.firstName.slice(1).toLowerCase()}{" "}
            {userInfo.lastName && userInfo.lastName.charAt(0).toUpperCase()}.
          </p>
        )}
        {userInfo && (
          <p className="StuDarolestyle">
            1/66,{" "}
            {userInfo.itAccountType === "StdAcc"
              ? "Student"
              : userInfo.itAccountType}
          </p>
        )}
      </div>

      <div>
        <h1>User Info</h1>
        <h3>cmuAccount : {userInfo.cmuAccount}</h3>
        <h3>firstName : {userInfo.firstName}</h3>
        <h3>lastName : {userInfo.lastName}</h3>
        <h3>studentId : {userInfo.studentId}</h3>
        <h3>itAccountType : {userInfo.itAccountType}</h3>
      </div>
      <button onClick={() => signOut().finally(navigate("/sign-in"))}>
        Sign out
      </button>
    </div>
  );
};

export default StudentDashboard;
