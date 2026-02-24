'use client'
import Marquee from '../ui/Marquee';
import AdDropdown from './AdDropdown';
import CountdownAnalog from './CountdownAnalog';

const Ads:React.FC = () => {
  const targetDate = new Date().getTime() + 24 * 3600 * 1000 + 5000;
  const Dropdown = (<CountdownAnalog targetDate={targetDate}/>)//(<Marquee text="Spotted! The perfect place for your products call now 09153392813" fontSize="35px" speed={10} />)
  return (
     <AdDropdown content={Dropdown}/>
  )
}

export default Ads
