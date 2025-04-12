// // src/components/TestPage.js
// import React from 'react';

// const TestPage = () => {
//   const clearStorage = () => {
//     try {
//       localStorage.clear();
//       alert('Local storage cleared successfully');
//     } catch (err) {
//       console.error('Error clearing localStorage:', err);
//       alert('Error clearing localStorage: ' + err.message);
//     }
//   };

//   return (
//     <div style={{ padding: '20px' }}>
//       <h1>Test Page</h1>
//       <p>If you can see this, the basic React setup is working.</p>
//       <p>This page can help diagnose issues with your application.</p>
      
//       <div style={{ marginTop: '20px' }}>
//         <h2>Local Storage Debug</h2>
//         <button 
//           onClick={clearStorage}
//           style={{
//             padding: '10px 15px',
//             backgroundColor: '#007bff',
//             color: 'white',
//             border: 'none',
//             borderRadius: '4px',
//             cursor: 'pointer'
//           }}
//         >
//           Clear Local Storage
//         </button>
        
//         <div style={{ marginTop: '20px' }}>
//           <h3>Current Local Storage Content:</h3>
//           <pre style={{ 
//             backgroundColor: '#f5f5f5', 
//             padding: '10px', 
//             borderRadius: '4px',
//             maxHeight: '300px',
//             overflow: 'auto'
//           }}>
//             {Object.keys(localStorage).map(key => (
//               `${key}: ${localStorage.getItem(key)}`
//             )).join('\n')}
//           </pre>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TestPage;