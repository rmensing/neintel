import axios from "axios";

//submit data to create report and get a report ID
export const submitReport = async (data) => {
    // console.log("test", JSON.stringify(data))
    // const res = await fetch('http://192.168.1.5:5000/report', {
    const res = await fetch(import.meta.env.VITE_API_URL + "/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
      body: JSON.stringify(data),
    });
    return res.json();
  };

  export const fetchReport = async (id) => {
    console.log("FETCH REPORT");
    try {
      const res = await axios.get(
        import.meta.env.VITE_API_URL + "/report/" + id,
        {
          headers: { "Content-Type": "application/json;charset=utf-8" }
        }
      );
      let result = res;
      console.log("FETCHREPORT -> RESULT", result.data);
      return result.data;
    } catch (error) {
      console.error(error);
    }
  };
  
  export const fetchZkill = async (id) => {
    try {
      const res = await axios.get(
        import.meta.env.VITE_API_URL + "/zkill/" + id,
        {
          headers: { "Content-Type": "application/json;charset=utf-8" },
        }
      );
      let result = res;
      console.log("FETCHZKILL -> RESULT", result.data);
      return result.data;
    } catch (error) {
      console.error(error);
    }
  };

  export const fetchShips = async () => {
    const res = await fetch(import.meta.env.VITE_API_URL + "/ships", {
      method: "GET",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
    });
    var result = res.json();
    // console.log(import.meta.env.API_URL)
    console.log("SHIPS=>", result)
    return result;
  };
  
  export const fetchTraits = async () => {
    const res = await fetch(import.meta.env.VITE_API_URL + "/traits", {
      method: "GET",
      headers: {
        "Content-Type": "application/json;charset=utf-8",
      },
    });
    var result = res.json();
    console.log("TRAITS=>", result);
    return result;
  };

