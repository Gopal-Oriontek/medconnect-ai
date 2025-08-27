import React from 'react';

function App() {
  const [selectedFlow, setSelectedFlow] = React.useState('customer');

  const FlowBox = ({ title, description, color = "bg-blue-100", textColor = "text-blue-800" }) => (
    <div className={`${color} ${textColor} p-4 rounded-lg shadow-md border-2 border-opacity-20 min-h-20 flex flex-col justify-center`}>
      <div className="font-semibold text-sm mb-1">{title}</div>
      {description && <div className="text-xs opacity-80">{description}</div>}
    </div>
  );

  const Arrow = ({ direction = "down" }) => (
    <div className="flex justify-center my-2">
      {direction === "down" && <div className="text-gray-600 text-2xl">↓</div>}
      {direction === "right" && <div className="text-gray-600 text-2xl">→</div>}
    </div>
  );

  const CustomerFlow = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-center mb-6 text-blue-800">Customer Journey Flow</h3>
      
      <FlowBox 
        title="Login / Sign Up" 
        description="User authentication & registration"
        color="bg-green-100" 
        textColor="text-green-800"
      />
      <Arrow />
      
      <FlowBox 
        title="Order Dashboard" 
        description="View existing orders & create new ones"
        color="bg-blue-100" 
        textColor="text-blue-800"
      />
      <Arrow />
      
      <FlowBox 
        title="Create New Order" 
        description="Start medical review request"
        color="bg-purple-100" 
        textColor="text-purple-800"
      />
      <Arrow />
      
      <div className="grid grid-cols-1 gap-4">

        <FlowBox 
          title="Step 1: Medical Details" 
          description="Department(Drop down) → Part of Organ(Drop down) → Location(Drop down)"
          color="bg-yellow-100" 
          textColor="text-yellow-800"
        />
        <Arrow />
        
        <FlowBox 
          title="Step 2: Opinion Type" 
          description="Select 1st Opinion or 2nd Opinion"
          color="bg-yellow-100" 
          textColor="text-yellow-800"
        />
        <Arrow />
        
        <FlowBox 
          title="Step 3: Problem Description" 
          description="Detailed description of medical issue"
          color="bg-yellow-100" 
          textColor="text-yellow-800"
        />
        <Arrow />

        <FlowBox 
          title="Step 4: Document Upload" 
          description="Upload medical documents (PDF, images, DOC)"
          color="bg-yellow-100" 
          textColor="text-yellow-800"
        />
      </div>
      <Arrow />
      
      <FlowBox 
        title="Payment Processing" 
        description="Secure payment & order confirmation"
        color="bg-red-100" 
        textColor="text-red-800"
      />
      <Arrow />
      
      <FlowBox 
        title="Order Tracking" 
        description="Monitor review progress & status updates"
        color="bg-indigo-100" 
        textColor="text-indigo-800"
      />
      <Arrow />
      
      <FlowBox 
        title="Review Completion" 
        description="Download results & schedule consultation"
        color="bg-green-100" 
        textColor="text-green-800"
      />
    </div>
  );

  const SystemFlow = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-center mb-6 text-purple-800">Complete System Workflow</h3>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="bg-blue-500 text-white p-2 rounded-lg font-semibold mb-2">CUSTOMER</div>
          <div className="text-sm text-gray-600">Creates orders, uploads documents, tracks progress</div>
        </div>
        <div className="text-center">
          <div className="bg-green-500 text-white p-2 rounded-lg font-semibold mb-2">REVIEWER</div>
          <div className="text-sm text-gray-600">Reviews documents, provides assessments</div>
        </div>
        <div className="text-center">
          <div className="bg-purple-500 text-white p-2 rounded-lg font-semibold mb-2">ADMIN</div>
          <div className="text-sm text-gray-600">Manages system, assigns orders, oversees process</div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-3 text-gray-800">Phase 1: Order Creation</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <FlowBox title="Customer selects service" color="bg-blue-50" textColor="text-blue-700" />
          <FlowBox title="Fills order details" color="bg-blue-50" textColor="text-blue-700" />
          <FlowBox title="Uploads documents" color="bg-blue-50" textColor="text-blue-700" />
          <FlowBox title="Payment & confirmation" color="bg-blue-50" textColor="text-blue-700" />
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-3 text-gray-800">Phase 2: Order Processing</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <FlowBox title="Order appears in reviewer dashboard" color="bg-green-50" textColor="text-green-700" />
          <FlowBox title="Reviewer self-assigns" color="bg-purple-50" textColor="text-purple-700" />
          <FlowBox title="Status: 'Assigned'" color="bg-yellow-50" textColor="text-yellow-700" />
          <FlowBox title="Notifications sent" color="bg-gray-100" textColor="text-gray-700" />
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-3 text-gray-800">Phase 3: Review Process</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <FlowBox title="Reviewer downloads documents" color="bg-green-50" textColor="text-green-700" />
          <FlowBox title="Status: 'In Progress'" color="bg-yellow-50" textColor="text-yellow-700" />
          <FlowBox title="Comprehensive assessment" color="bg-green-50" textColor="text-green-700" />
          <FlowBox title="Review submission" color="bg-green-50" textColor="text-green-700" />
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-3 text-gray-800">Phase 4: Completion & Consultation</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <FlowBox title="Status: 'Completed'" color="bg-green-100" textColor="text-green-800" />
          <FlowBox title="Customer notification" color="bg-blue-50" textColor="text-blue-700" />
          <FlowBox title="Optional consultation scheduling" color="bg-purple-50" textColor="text-purple-700" />
          <FlowBox title="Payment to reviewer" color="bg-red-50" textColor="text-red-700" />
        </div>
      </div>
    </div>
  );

  const TechnicalFlow = () => (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-center mb-6 text-indigo-800">Technical Architecture Flow</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-800 mb-3">Frontend Layer</h4>
          <div className="space-y-2 text-sm">
            <FlowBox title="User Interface" description="React/Vue.js dashboard" color="bg-blue-100" textColor="text-blue-800" />
            <FlowBox title="File Upload" description="Drag & drop functionality" color="bg-blue-100" textColor="text-blue-800" />
            <FlowBox title="Real-time Updates" description="WebSocket notifications" color="bg-blue-100" textColor="text-blue-800" />
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-3">Backend Services</h4>
          <div className="space-y-2 text-sm">
            <FlowBox title="API Gateway" description="RESTful API endpoints" color="bg-green-100" textColor="text-green-800" />
            <FlowBox title="Authentication" description="JWT token management" color="bg-green-100" textColor="text-green-800" />
            <FlowBox title="Order Management" description="Workflow orchestration" color="bg-green-100" textColor="text-green-800" />
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="font-semibold text-purple-800 mb-3">Data & Storage</h4>
          <div className="space-y-2 text-sm">
            <FlowBox title="Database" description="PostgreSQL/MongoDB" color="bg-purple-100" textColor="text-purple-800" />
            <FlowBox title="File Storage" description="AWS S3/Cloud storage" color="bg-purple-100" textColor="text-purple-800" />
            <FlowBox title="Payment Gateway" description="Stripe/PayPal integration" color="bg-purple-100" textColor="text-purple-800" />
          </div>
        </div>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg mt-6">
        <h4 className="font-semibold text-gray-800 mb-3">Integration Requirements</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <FlowBox title="Video Conferencing" description="Zoom/WebRTC API" color="bg-yellow-100" textColor="text-yellow-800" />
          <FlowBox title="Email Service" description="SendGrid/AWS SES" color="bg-red-100" textColor="text-red-800" />
          <FlowBox title="SMS Notifications" description="Twilio integration" color="bg-indigo-100" textColor="text-indigo-800" />
          <FlowBox title="Analytics" description="Google Analytics" color="bg-pink-100" textColor="text-pink-800" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Medical Review Platform</h1>
        <p className="text-gray-600">Comprehensive Workflow & System Architecture</p>
      </div>

      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg flex space-x-1">
          <button
            onClick={() => setSelectedFlow('customer')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedFlow === 'customer' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Customer Journey
          </button>
          <button
            onClick={() => setSelectedFlow('system')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedFlow === 'system' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            System Workflow
          </button>
          <button
            onClick={() => setSelectedFlow('technical')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              selectedFlow === 'technical' 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            Technical Architecture
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        {selectedFlow === 'customer' && <CustomerFlow />}
        {selectedFlow === 'system' && <SystemFlow />}
        {selectedFlow === 'technical' && <TechnicalFlow />}
      </div>

      <div className="mt-8 bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">Key Features Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-blue-800 mb-1">User Management</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Multi-role authentication</li>
              <li>• Profile management</li>
              <li>• Permission-based access</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-green-800 mb-1">Order Processing</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Document upload & management</li>
              <li>• Status tracking</li>
              <li>• Assignment workflow</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-purple-800 mb-1">Communication</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Video consultations</li>
              <li>• Email notifications</li>
              <li>• Real-time updates</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;