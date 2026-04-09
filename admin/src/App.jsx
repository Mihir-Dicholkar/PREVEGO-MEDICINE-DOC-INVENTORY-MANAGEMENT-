import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Inventory from "./pages/Inventory";
import AdminApp from "./admin";
import ProtectedRoute from "./ProtectedRoute";
import Uploads from "./pages/upload"
import Edit from "./pages/edit";
import Log from "./pages/log";
import Login from "./login";
import Settings from "./pages/settings";
import NotFound from "./pages/NotFound";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
function App() {
  return (
    <>
    
    <Router>
           <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Routes>
        {/* Admin layout with nested pages at the root */}
        
        <Route path="/" element={<Login />} />
        <Route path="admin" element={<ProtectedRoute><AdminApp/></ProtectedRoute>}>
          <Route index element={<Uploads />} />
          <Route path="upload" element={<Uploads />} />
          <Route path="edit" element={<Edit />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="notfound" element={<NotFound/>} />
            <Route path="settings" element={<Settings/>} />

          <Route path="log" element={<Log />} />
        
        </Route>
            <Route path="/edit/:batchId" element={<Edit />} />
             <Route path="*" element={<NotFound />} />
              
      </Routes>
       
    </Router>
    </>
  );
}

export default App;
