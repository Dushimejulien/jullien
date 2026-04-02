import React, { useContext } from "react";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import { Store } from "../Store";

export default function CheckSteps(props) {
  const { state } = useContext(Store);
  const { userInfo } = state;
  return (
    <Row className="checkout-steps">
      <Col className={props.step1 ? "active" : ""}>Injira</Col>
      <Col className={props.step2 ? "active" : ""}>Tumiza</Col>
      <Col className={props.step3 ? "active" : ""}>Ishyura</Col>
      {userInfo.isAdmin === true || userInfo.suAdmin === true ? (
        <Col className={props.step4 ? "active" : ""}>Report</Col>
      ) : (
        <Col className={props.step4 ? "active" : ""}>Emeza Gutumiza</Col>
      )}
    </Row>
  );
}
