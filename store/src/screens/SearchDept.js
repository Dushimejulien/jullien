import React, { useContext, useEffect, useReducer, useState } from "react";
import { Row, Col, Button } from "react-bootstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Store } from "../Store";
import { Helmet } from "react-helmet-async";
import MessageBox from "../components/MessageBox";
import { LinkContainer } from "react-router-bootstrap";
import LoadingBox from "../components/LoadingBox";
import { toast } from "react-toastify";
import { getError } from "../utils";
import ReportScreen from "./ReportScreen";

const reducer = (state, action) => {
  switch (action.type) {
    case "FETCH_REQUEST":
      return { ...state, loading: true };
    case "FETCH_SUCCESS":
      return {
        ...state,
        loading: false,
        report: action.payload.report,
        countReport: action.payload.countReport,
        page: action.payload.page,
        pages: action.payload.pages,
      };
    case "FETCH_FAIL":
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    default:
      return state;
  }
};

function SearchForm() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const ibyangiritse = sp.get("ibyangiritse") || "all";
  const soldAt = sp.get("soldAt") || "all";
  const depts = sp.get("depts") || "all";
  const real = sp.get("real") || "all";
  const page = sp.get("page") || 1;
  const comments = sp.get("comments") || "all";
  const givenTo = sp.get("givenTo") || "all";

  const query = sp.get("query") || "all";
  const { state } = useContext(Store);
  const [given, setGiven] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axios.get(`/api/report/given`);
        setGiven(data);
      } catch (err) {
        toast.error(getError(err));
      }
    };
    fetchCategories();
  }, []);

  const [{ loading, error, report, pages, countReport }, dispatch] = useReducer(
    reducer,
    {
      loading: true,
      error: "",
    }
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${state.userInfo.token}`,
          },
        };
  
        const apiUrl = `/api/report/search?page=${page}&query=${query}&ibyangiritse=${ibyangiritse}&soldAt=${soldAt}&depts=${depts}&real=${real}&comments=${comments}`;
        
        // Only fetch data if the 'depts' value is greater than 0
        if (depts > 0) {
          const { data } = await axios.get(apiUrl, config);
          dispatch({ type: "FETCH_SUCCESS", payload: data });
        } else {
          // If 'depts' is not greater than 0, set report to an empty array
          dispatch({ type: "FETCH_SUCCESS", payload: { report: [], countReport: 0 } });
        }
      } catch (error) {
        dispatch({ type: "FETCH_FAIL", payload: error.message });
      }
    };
  
    fetchData();
  }, [givenTo, query, state, page, ibyangiritse, soldAt, depts, real, comments]);
  

  const filterGivenTo = (filter) => {
    const filterPage = filter.page || page;
    const filtergivenTo = filter.givenTo || givenTo;
    const filterQuery = filter.query || query;
    const filterIbyangiritse = filter.ibyangiritse || ibyangiritse;
    const filtersoldAt = filter.soldAt || soldAt;
    const filterComments = filter.comments || comments;
    const filterReal = filter.real || real;
    const filterDepts = filter.depts || depts;
    return `/search?givenTo=${filtergivenTo}&query=${filterQuery}&page${filterPage}&ibyangiritse=${filterIbyangiritse}&soldAt=${filtersoldAt}&comments=${filterComments}&real=${filterReal}&depts=${filterDepts}`;
  };

  return (
    <div>
      <Helmet>
        <title>Search report</title>
      </Helmet>
      <Row>
        <Col md={3}>
          <h3>Umwihariko</h3>
          <div>
            <ul>
              <li>
                <Link
                  className={"all" === givenTo ? "text-bold" : ""}
                  to={filterGivenTo({ givenTo: "all" })}
                >
                  Byose
                </Link>
              </li>
              {given.map((c) => (
                <li key={c}>
                  <Link
                    className={c === givenTo ? "text-bold" : ""}
                    to={filterGivenTo({ givenTo: c })}
                  >
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3>Ababikunze</h3>
            <ul></ul>
          </div>
        </Col>
        <Col md={9}>
          {loading ? (
            <LoadingBox></LoadingBox>
          ) : error ? (
            <MessageBox variant="danger">{error}</MessageBox>
          ) : (
            <>
              <Row className="justify-content-between mb-3">
                <Col md={6}>
                  <div>
                    {countReport === 0 ? "No" : countReport} Results
                    {query !== "all" && " : " + query}
                    {givenTo !== "all" && " : " + givenTo}
                    {query !== "all" || givenTo !== "all" ? (
                      <Button
                        variant="light"
                        onClick={() => navigate("/depts")}
                      >
                        <i className="fas fa-times-circle"></i>
                      </Button>
                    ) : null}
                  </div>
                </Col>
              </Row>
              {report.length === 0 && (
                <MessageBox>Nta gicuruzwa kibonetse</MessageBox>
              )}

              <Row>
                {report.map((report) => (
                  <Col sm={6} lg={4} className="mb-3" key={report._id}>
                    <ReportScreen product={report} />
                  </Col>
                ))}
              </Row>

              <div>
              {[...Array(Math.min(5, pages)).keys()].map((x) => (
    <LinkContainer
      key={x + 1}
      className="mx-1"
      to={filterGivenTo({ page: x + 1 })}
    >
      <Button
        className={Number(page) === x + 1 ? "text-bold" : ""}
        variant="light"
      >
        {x + 1}
      </Button>
    </LinkContainer>
  ))}
              </div>
            </>
          )}
        </Col>
      </Row>
    </div>
  );
}

export default SearchForm;
