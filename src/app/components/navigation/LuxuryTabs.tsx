"use client";

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, EffectFade } from "swiper/modules";
import LuxuryTab from "./LuxuryTab";
import FAQ from "./content/FAQ";
import ContactUs from "./content/ContactUs";
import TermsOfService from "./content/TermsOfService";
import PrivacyPolicy from "./content/PrivacyPolicy";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

interface TabItem {
  id: string;
  label: string;
  content: JSX.Element;
}

const LuxuryTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const tabItems: TabItem[] = [
    { id: "faq", label: "FAQ", content: <FAQ /> },
    { id: "contact", label: "Contact Us", content: <ContactUs /> },
    { id: "terms", label: "Terms of Service", content: <TermsOfService /> },
    { id: "privacy", label: "Privacy Policy", content: <PrivacyPolicy /> },
  ];

  const handleTabClick = (index: number) => {
    setActiveTab(index);
  };

  return (
    <div className="luxury-tabs-container min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Luxury Header */}
      <div className="text-center py-12 px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-yellow-600">
          Premium Experience
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Discover our exclusive services and offerings
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="luxury-tabs-navigation relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-center mb-8">
            <div className="bg-black/20 backdrop-blur-md rounded-full p-1.5 border border-white/10 shadow-2xl">
              <div className="flex flex-wrap justify-center gap-2">
                {tabItems.map((tab, index) => (
                  <LuxuryTab
                    key={tab.id}
                    label={tab.label}
                    isActive={activeTab === index}
                    onClick={() => handleTabClick(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Swiper Content */}
      <div className="luxury-tabs-content relative z-0">
        <div className="container mx-auto px-4 pb-20">
          <div className="bg-black/10 backdrop-blur-lg rounded-3xl border border-white/10 p-6 md:p-8 shadow-2xl">
            <Swiper
              modules={[Navigation, Pagination, EffectFade]}
              spaceBetween={50}
              slidesPerView={1}
              navigation={{
                prevEl: ".swiper-button-prev",
                nextEl: ".swiper-button-next",
              }}
              pagination={{
                clickable: true,
                el: ".swiper-pagination",
                type: "bullets",
                bulletClass: "swiper-pagination-bullet luxury-bullet",
                bulletActiveClass:
                  "swiper-pagination-bullet-active luxury-bullet-active",
              }}
              effect="fade"
              fadeEffect={{ crossFade: true }}
              speed={800}
              allowTouchMove={false}
              onSlideChange={(swiper) => setActiveTab(swiper.activeIndex)}
              initialSlide={activeTab}
            >
              {tabItems.map((tab) => (
                <SwiperSlide key={tab.id}>
                  <div className="min-h-[400px] flex items-center justify-center py-8">
                    {tab.content}
                  </div>
                </SwiperSlide>
              ))}

              {/* Custom Navigation */}
              <div className="swiper-button-prev luxury-nav-button"></div>
              <div className="swiper-button-next luxury-nav-button"></div>
              <div className="swiper-pagination luxury-pagination"></div>
            </Swiper>
          </div>
        </div>
      </div>

      <style jsx>{`
        .luxury-nav-button {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          width: 60px;
          height: 60px;
          border-radius: 50%;
          color: #f8d210;
          transition: all 0.3s ease;
        }

        .luxury-nav-button:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.1);
        }

        .luxury-nav-button::after {
          font-size: 20px;
          font-weight: bold;
        }

        .luxury-bullet {
          background: rgba(255, 255, 255, 0.3);
          width: 12px;
          height: 12px;
          margin: 0 6px;
          transition: all 0.3s ease;
        }

        .luxury-bullet-active {
          background: #f8d210;
          transform: scale(1.3);
        }

        .luxury-pagination {
          bottom: -40px;
        }

        @media (max-width: 768px) {
          .luxury-nav-button {
            width: 40px;
            height: 40px;
          }

          .luxury-nav-button::after {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default LuxuryTabs;
