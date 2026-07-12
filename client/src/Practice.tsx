import { useState } from "react";

// function Counter(){
//     const[count,setCount]=useState(0);
//     return(
//         <div>
//             <h2>{count}</h2>
//             <button onClick={() => setCount(count + 1)}>+1</button>
//         </div>
//     )
// }
// export default Counter


// function Toggle(){
//     const[isOn,toggle]=useState(false);
//     return(
//         <div>
//             <h2>{isOn ? "ON" : "OFF"}</h2>
//             <button onClick={()=>toggle(!isOn)}>flip</button>

//         </div>
//     )
// }
// export default Toggle

function Preview(){
    const[text,setText]=useState("");
    return(
        <div>

<input value={text} onChange={(e) => setText(e.target.value)} />



<h2>You typed:{text}</h2>
        </div>
    )
}
export default Preview 