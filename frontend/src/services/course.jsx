import axios from "axios";

export async function addCourse(data) {
  try {
    console.log(data);
    const resp = await axios.post(
      `${process.env.REACT_APP_BASE_URL}/api/v1/course/add`,
      data,
      {
        timeout: 5000,
        withCredentials: true
      }
    );
    return resp.data;
  } catch (err) {
    return err.response;
  }
}

export async function addCoInstructors(req, coInstructors) {
  try {
    const resp = await axios.put(
      `${process.env.REACT_APP_BASE_URL}/api/v1/course`,
      {
        params: {
          courseNo: req.courseNo,
          section: req.section,
          year: req.year,
          semester: req.semester,
          coInstructors: coInstructors,
        },
        timeout: 5000,
        withCredentials: true,
      }
    );
    return resp.data;
  } catch (err) {
    return err.response;
  }
}
