  import React from "react";
  import Section from "../../components/user/Section.jsx";
  import Button from "../../components/user/Button.jsx";
  import UserNavbar from "../../components/user/UserNavbar.jsx";
  import IntroTour from "../../components/IntroTour.jsx";
  import Footer from "../../components/user/Footer.jsx";
  import { useAuth } from '../../context/AuthContext';  // Add this import



  import CaffieneLogo from '../../assets/Caffiene.png'
  import { Megaphone, AlertTriangle, SearchCheck } from "lucide-react";

  import { Link } from "react-router-dom";


  export default function Dashboard({ name  }) {
    const { user } = useAuth();  // Add this line
    const userId = user?.id;      // Add this line
    
    const services = [
      
      {
        icon: "complaint",
        title: "शिकायत दर्ज करें", 
        englishTitle: "File Complaint",
        description: "नागरिक समस्याओं की रिपोर्ट करें और उनकी स्थिति को ट्रैक करें।",
        englishDesc: "Report civic issues and track their resolution status.",
        features: ["24/7 सहायता", "स्थिति ट्रैकिंग", "त्वरित समाधान"],
        link:"Complaint",
      },
    
      {
      
        icon: "water",
        title: "अपनी शिकायत की स्थिति देखें", 
        englishTitle: "Track Your Complaint",
        description: "नए जल कनेक्शन, डिस्कनेक्शन और गुणवत्ता रिपोर्ट।",
        englishDesc: "New water connections and quality reports.",
        features: ["कनेक्शन स्थिति", "गुणवत्ता रिपोर्ट", "आपातकालीन सेवाएं"],
        link:"Track Your Complaint"
      }
    ];

    const features = [
      {
        icon: "check",
        title: "24/7 ऑनलाइन सेवाएं",
        englishTitle: "24/7 Online Services",
        
      },
      {
        icon: "check", 
        title: "सुरक्षित और विश्वसनीय",
        englishTitle: "Secure & Reliable",

      },
      {
        icon: "check",
        title: "मोबाइल फ्रेंडली", 
        englishTitle: "Mobile Friendly",
        
      },
      {
        icon: "check",
        title: "रियल-टाइम अपडेट",
        englishTitle: "Real-time Updates", 
      }
    ];

    const stats = [
      { number: "50,000+", label: "नागरिक सेवित", englishLabel: "Citizens Served" },
      { number: "95%", label: "संतुष्टि दर", englishLabel: "Satisfaction Rate" },
      { number: "24/7", label: "ऑनलाइन सहायता", englishLabel: "Online Support" },
      
    ];

    const [showTour, setShowTour] = React.useState(false);

    React.useEffect(() => {
      // start tour for first-time users only
      const onboarded = localStorage.getItem('ns_onboarded_v1');
      if (!onboarded) {
        // small timeout to ensure DOM elements mount
        setTimeout(() => setShowTour(true), 500);
      }
    }, []);

    const tourSteps = [
      { element: '#nav-home', intro: 'यहां से होम पेज पर लौटें (Home).' },
      { element: '#nav-analytics', intro: 'Analytics पेज पर जाएँ और डेटा देखें।' },
      { element: '#nav-user', intro: 'यहाँ से आप अपनी प्रोफ़ाइल और लॉगआउट कर सकते हैं।' },
      { element: '#stat-0', intro: 'यहाँ आप साइट के प्रमुख आंकड़े देख सकते हैं।' },
      { element: '#service-0', intro: 'शिकायत दर्ज करने के लिए इस बटन का उपयोग करें।' },
      { element: '#service-1', intro: 'अपनी शिकायत ट्रैक करने के लिए यहाँ जाएँ।' },
      { element: '.p-6 .px-6 button, .p-6 .px-6 a', intro: 'सपोर्ट/कॉन्टैक्ट बटन।' },
    ];

    const handleTourExit = () => {
      localStorage.setItem('ns_onboarded_v1', '1');
      setShowTour(false);
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
          <UserNavbar/>
          <IntroTour steps={tourSteps} start={showTour} onExit={handleTourExit} />
      

        {/* Hero Section */}
        <Section background="white" padding="xlarge">
          <div className="text-center relative">
          
            
            <div className="relative z-10 mb-2">
            
              <div className="flex justify-center  mb-0">
                    <img src={CaffieneLogo} alt=""  style={{ width: "120px", height: "120px",  }}/>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-5">
                  {name}
                </h2>
              <div className="space-y-3">
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 px-6 py-2 mb-5 rounded-full border border-blue-200">
                  <span className="w-2 h-2 bg-green rounded-full animate-pulse"></span>
                  <span className="text-sm font-semibold text-gray-700">अत्याधुनिक डिजिटल प्लेटफॉर्म | Digital Platform</span>
                </div>
                
              
                
                
                
              
              </div>
            </div>
            
        
            <div className="relative">
              <div className="relative bg-white/80 backdrop-blur-xl border border-white/50 p-3 rounded-3xl shadow-xl">
                <div className="grid grid-cols-3 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div key={index} id={`stat-${index}`} className="text-center group">
                      <div className="relative mb-2">
                        <div className={`text-xl md:text-xl font-bold bg-gradient-to-r ${
                          index === 0 ? 'from-blue-600 to-purple-600' :
                          index === 1 ? 'from-green to-emerald-600' :
                          index === 2 ? 'from-orange-600 to-red-600' :
                          'from-purple-600 to-pink-600'
                        } bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300`}>
                          {stat.number}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-gray-700 font-semibold text-sm">{stat.label}</div>
                        <div className="text-gray-500 text-sm font-semibold">{stat.englishLabel}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Section>

        
        <Section background="gray" >
          <div className="text-center mb-10">
            
            <h2 className="text-3xl md:text-3xl font-bold mb-4">
              <span className="bg-black bg-clip-text text-transparent">
                हमारी सेवाएं | Our Services
              </span>
            </h2>
            
            
            
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {services.map((service, index) => (
        <div key={index} className="group relative ">
                
                
                <div className="relative   bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden h-full transform  transition-all duration-500 ">
        
                  <div className="p-6 pb-4">
                    <div className="flex items-start space-x-4 mb-4">
                      <div className={`relative p-4 rounded-xl bg-green  shadow-lg transform  transition-transform duration-500`}>
                        <AlertTriangle className="w-6 h-6 text-white"   />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{service.title}</h3>
                        <h4 className="text-sm font-semibold text-gray-600 mb-2">{service.englishTitle}</h4>
                        
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-gray-700 text-sm leading-relaxed">{service.description}</p>
                      <p className="text-gray-500 text-xs leading-relaxed">{service.englishDesc}</p>
                    </div>
                  </div>
                
                  <div className="px-6 pb-4">
                    <div className="space-y-2">
                      {service.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center space-x-2 text-sm text-gray-600">
                          <div className="w-4 h-4 bg-gradient-to-r from-green to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span>{feature}</span>
                        </div>
                        
                        
                      ))}
                    </div>
                  </div>
                  
                
                    <div className="p-6 pt-0">
                    
                    <Link id={`service-${index}`} to={`/${service.link}`} className=
                  {`w-full bg-green  text-white px-6 py-3 rounded-xl font-semibold
                    transition-all duration-300 hover:shadow-lg transform hover:bg-green`}>
                    {service.link}
                    
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Features Section */}
        <Section background="white" padding="small">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-4">
              <div className="bg-green text-white px-6 py-2 rounded-full text-sm font-semibold">
                विशेषताएं | FEATURES
              </div>
            </div>
            
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              हमारे नवाचार डिजिटल प्लेटफॉर्म के साथ नगरपालिका सेवाओं के भविष्य का अनुभव करें।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-8xl mx-auto">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4 bg-gray-50 p-5 rounded-lg border-l-4 border-green">
                <div className="bg-green p-3 rounded-lg flex-shrink-0">
                  
                </div>
                <div>
                  <h3 className="text-md font-semibold text-gray-900 mb-1">{feature.title}</h3>
                  <h4 className="text-sm font-medium text-blue-900 mb-2">{feature.englishTitle}</h4>
                  
                </div>
              </div>
            ))}
          </div>
        </Section>

        
        {/* Contact Section */}
        <Section background="white" padding="large">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Need Help?</h2>
            <p className="text-xl text-gray-600 mb-12">
              Our support team is here to assist you with any questions or concerns.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Call Us</h3>
                <p className="text-gray-600">+91-1234-567-890</p>
                <p className="text-sm text-gray-500">Available 24/7</p>
              </div>

              <div className="text-center">
                <div className="bg-green w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Us</h3>
                <p className="text-gray-600">support@nagarseva.gov.in</p>
                <p className="text-sm text-gray-500">Response within 24 hours</p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Visit Us</h3>
                <p className="text-gray-600">Municipal Corporation Office</p>
                <p className="text-sm text-gray-500">Mon-Fri: 9 AM - 6 PM</p>
              </div>
            </div>

            <div className="mt-12">
              <Button size="lg">
                Contact Support
              </Button>
            </div>
          </div>
          
          
        </Section>
        <Footer/>

        
      </div>
    );
  }