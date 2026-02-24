'use client'
import Marquee from '../ui/Marquee';
import AdDropdown from './AdDropdown';
import CountdownAnalog from './CountdownAnalog';

const Ads:React.FC = () => {
  // Set target date to July 27, 2026 (note: month is 0-indexed in JavaScript)
  const targetDate = new Date(2026, 6, 27).getTime(); // July is month 6 (0-indexed)
  
  const Dropdown = (<CountdownAnalog targetDate={targetDate}/>)//(<Marquee text="Spotted! The perfect place for your products call now 09153392813" fontSize="35px" speed={10} />)
  return (
     <AdDropdown content={Dropdown}/>
  )
}

export default Ads
