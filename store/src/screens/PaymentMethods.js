import React, { useContext, useState } from "react";
import { Helmet } from "react-helmet-async";
import Form from "react-bootstrap/Form";
import CheckoutSteps from "../components/Checksteps";
import Button from "react-bootstrap/Button";
import { Store } from "../Store";
import { useNavigate } from "react-router-dom";

export default function PaymentMethods() {
  const [paymentMethodName, setPaymentMethod] = useState();
  const navigate = useNavigate();
  const { state, dispatch: ctxDispatch } = useContext(Store);
  const { userInfo } = state;

  const submitHandler = (e) => {
    e.preventDefault();
    ctxDispatch({ type: "SAVE_PAYMENT_METHODS", payload: paymentMethodName });
    localStorage.setItem("paymentMethod", paymentMethodName);
    if (userInfo.isAdmin || userInfo.isSeller) {
      navigate("/reportReview");
    } else {
      navigate("/placeorder");
    }
  };
  return (
    <div>
      <CheckoutSteps step1 step2 step3></CheckoutSteps>
      <div className="container small-container">
        <Helmet>
          <title>Ubwishyu</title>
        </Helmet>
        <h1 className="my-3">Ubwishyu</h1>
        <Form onSubmit={submitHandler}>
          {userInfo.isAdmin === true || userInfo.isSeller === true ? (
            <>
              <div className="mb-3">
                <Form.Check
                  type="radio"
                  id="MoMo pay"
                  label="MoMo pay"
                  value="MoMo pay"
                  cheched={paymentMethodName === "MoMo pay"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <Form.Check
                  type="radio"
                  id="Cash"
                  label="Cash"
                  value="Cash"
                  cheched={paymentMethodName === "Cash"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <Form.Check
                  type="radio"
                  id="Loss"
                  label="Loss"
                  value="Loss"
                  cheched={paymentMethodName === "Loss"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <Form.Check
                  type="radio"
                  id="Depts"
                  label="Depts"
                  value="Depts"
                  cheched={paymentMethodName === "Muntoki"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
              </div>
            </>
          ) : (
            <div className="mb-3">
              <>
                <div className="mb-3">
                  <Form.Check
                    type="radio"
                    value="Paypal"
                    id="Paypal"
                    label="Paypal"
                    checked={paymentMethodName === "Paypal"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <Form.Check
                    type="radio"
                    value="MoMo"
                    id="MoMo"
                    label="MoMo"
                    checked={paymentMethodName === "MoMo"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                </div>
              </>
            </div>
          )}

          <div className="mb-3">
            <Button type="submit">Komeza</Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
