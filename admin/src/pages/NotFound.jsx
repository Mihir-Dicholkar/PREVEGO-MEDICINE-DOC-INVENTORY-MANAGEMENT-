// src/pages/NotFound.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  const leftEyeRef = useRef(null);
  const rightEyeRef = useRef(null);
  const leftPupilRef = useRef(null);
  const rightPupilRef = useRef(null);
  const containerRef = useRef(null);
  
  const [isLeftWinking, setIsLeftWinking] = useState(false);
  const [isRightWinking, setIsRightWinking] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);

  // Smooth pupil tracking with realistic constraints
  useEffect(() => {
    let animationFrameId;
    let targetLeftX = 0;
    let targetLeftY = 0;
    let targetRightX = 0;
    let targetRightY = 0;
    let currentLeftX = 0;
    let currentLeftY = 0;
    let currentRightX = 0;
    let currentRightY = 0;

    const handleMouseMove = (e) => {
      if (!leftEyeRef.current || !rightEyeRef.current) return;

      // Get eye positions
      const leftEyeRect = leftEyeRef.current.getBoundingClientRect();
      const rightEyeRect = rightEyeRef.current.getBoundingClientRect();

      // Calculate eye centers
      const leftCenter = {
        x: leftEyeRect.left + leftEyeRect.width / 2,
        y: leftEyeRect.top + leftEyeRect.height / 2,
      };
      const rightCenter = {
        x: rightEyeRect.left + rightEyeRect.width / 2,
        y: rightEyeRect.top + rightEyeRect.height / 2,
      };

      // Mouse position
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      // Calculate direction vectors
      const leftDx = mouseX - leftCenter.x;
      const leftDy = mouseY - leftCenter.y;
      const rightDx = mouseX - rightCenter.x;
      const rightDy = mouseY - rightCenter.y;

      // Calculate distances
      const leftDistance = Math.sqrt(leftDx * leftDx + leftDy * leftDy);
      const rightDistance = Math.sqrt(rightDx * rightDx + rightDy * rightDy);

      // Max pupil movement radius (in pixels)
      const maxRadius = 12;
      
      // Calculate target positions with smooth falloff at edges
      const leftAngle = Math.atan2(leftDy, leftDx);
      const rightAngle = Math.atan2(rightDy, rightDx);
      
      // Move less when mouse is far (realistic eye movement)
      const leftMovement = Math.min(maxRadius, leftDistance / 15);
      const rightMovement = Math.min(maxRadius, rightDistance / 15);
      
      targetLeftX = Math.cos(leftAngle) * leftMovement;
      targetLeftY = Math.sin(leftAngle) * leftMovement;
      targetRightX = Math.cos(rightAngle) * rightMovement;
      targetRightY = Math.sin(rightAngle) * rightMovement;
    };

    // Smooth animation for pupil movement
    const animatePupils = () => {
      // Easing for smooth movement (0.15 for smooth follow, not too fast)
      currentLeftX += (targetLeftX - currentLeftX) * 0.15;
      currentLeftY += (targetLeftY - currentLeftY) * 0.15;
      currentRightX += (targetRightX - currentRightX) * 0.15;
      currentRightY += (targetRightY - currentRightY) * 0.15;

      if (leftPupilRef.current && !isLeftWinking && !isBlinking) {
        leftPupilRef.current.style.transform = `translate(${currentLeftX}px, ${currentLeftY}px)`;
      }
      if (rightPupilRef.current && !isRightWinking && !isBlinking) {
        rightPupilRef.current.style.transform = `translate(${currentRightX}px, ${currentRightY}px)`;
      }

      animationFrameId = requestAnimationFrame(animatePupils);
    };

    window.addEventListener("mousemove", handleMouseMove);
    animatePupils();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isLeftWinking, isRightWinking, isBlinking]);

  // Automatic blinking and random winking
  useEffect(() => {
    let blinkTimeout;
    let winkInterval;

    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
      }, 150);
    };

    const randomWink = () => {
      // Randomly choose left or right eye to wink
      const whichEye = Math.random() > 0.5 ? 'left' : 'right';
      
      if (whichEye === 'left') {
        setIsLeftWinking(true);
        setTimeout(() => {
          setIsLeftWinking(false);
        }, 200);
      } else {
        setIsRightWinking(true);
        setTimeout(() => {
          setIsRightWinking(false);
        }, 200);
      }
    };

    // Regular blinking every 3-5 seconds
    const scheduleBlink = () => {
      const delay = 3000 + Math.random() * 2000;
      blinkTimeout = setTimeout(() => {
        blink();
        scheduleBlink();
      }, delay);
    };

    // Random winking every 8-12 seconds
    const scheduleWink = () => {
      const delay = 8000 + Math.random() * 4000;
      winkInterval = setTimeout(() => {
        randomWink();
        scheduleWink();
      }, delay);
    };

    scheduleBlink();
    scheduleWink();

    return () => {
      clearTimeout(blinkTimeout);
      clearTimeout(winkInterval);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4"
    >
      <div className="text-center max-w-2xl animate-fade-in-up">
        {/* Animated 404 Text */}
        <div className="relative mb-8">
          <h1 className="text-9xl md:text-[12rem] font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <div className="w-64 h-64 bg-red-500 rounded-full blur-3xl animate-ping"></div>
          </div>
        </div>

        {/* Eyes Container */}
        <div className="flex justify-center gap-12 mb-10">
          {/* Left Eye */}
          <div className="relative">
            <div 
              ref={leftEyeRef}
              className="relative w-32 h-32 bg-white rounded-full shadow-2xl border-4 border-gray-700 overflow-hidden"
            >
              {/* Iris */}
              <div 
                ref={leftPupilRef}
                className="absolute w-14 h-14 bg-gradient-to-br from-amber-800 to-amber-900 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-100 ease-out"
              >
                {/* Pupil */}
                <div className="absolute w-7 h-7 bg-black rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  {/* Light reflection */}
                  <div className="absolute w-2.5 h-2.5 bg-white rounded-full top-1 left-1 opacity-90"></div>
                  <div className="absolute w-1.5 h-1.5 bg-white rounded-full bottom-1 right-1 opacity-70"></div>
                </div>
              </div>
              
              {/* Eyelid overlay for blinking/winking */}
              {(isLeftWinking || isBlinking) && (
                <div className="absolute inset-0 bg-gradient-to-b from-gray-800 via-gray-800 to-transparent rounded-full animate-blink">
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-gray-800 rounded-t-full"></div>
                </div>
              )}
            </div>
          </div>

          {/* Right Eye */}
          <div className="relative">
            <div 
              ref={rightEyeRef}
              className="relative w-32 h-32 bg-white rounded-full shadow-2xl border-4 border-gray-700 overflow-hidden"
            >
              {/* Iris */}
              <div 
                ref={rightPupilRef}
                className="absolute w-14 h-14 bg-gradient-to-br from-amber-800 to-amber-900 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-100 ease-out"
              >
                {/* Pupil */}
                <div className="absolute w-7 h-7 bg-black rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  {/* Light reflection */}
                  <div className="absolute w-2.5 h-2.5 bg-white rounded-full top-1 left-1 opacity-90"></div>
                  <div className="absolute w-1.5 h-1.5 bg-white rounded-full bottom-1 right-1 opacity-70"></div>
                </div>
              </div>
              
              {/* Eyelid overlay for blinking/winking */}
              {(isRightWinking || isBlinking) && (
                <div className="absolute inset-0 bg-gradient-to-b from-gray-800 via-gray-800 to-transparent rounded-full animate-blink">
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-gray-800 rounded-t-full"></div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message */}
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 animate-bounce">
          Oops! Page Not Found
        </h2>
        <p className="text-gray-300 text-lg mb-3">
          The page you are looking for doesn't exist or you don't have access.
        </p>
       

        {/* Back to Login Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl group"
        >
          <svg
            className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Go to Login
        </Link>
      </div>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes blink {
          0% {
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          20% {
            opacity: 1;
          }
          30% {
            opacity: 0;
          }
          100% {
            opacity: 0;
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out;
        }
        
        .animate-blink {
          animation: blink 0.2s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default NotFound;