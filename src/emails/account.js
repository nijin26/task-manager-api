const sgMail = require("@sendgrid/mail");


sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
  const msg = {
    to: email,
    from: "nijinazarkpz@gmail.com",
    subject: "Thanks for Signing Up to Task Manager App !",
    text: `Welcome to the app, ${name}  Let me know how you get along with the app.`,
  };

  sgMail
    .send(msg)
    .then(() => {
      console.log("Email sent");
    })
    .catch((error) => {
      console.error(error);
    });
};

const sendDeleteMail = (email,name) => {
    const msg = {
      to: email,
      from: "nijinazarkpz@gmail.com",
      subject: "Sorry to see you go",
      text:`Goodbye, ${name}. I hope to see you back sometime soon.`
    };

     sgMail
       .send(msg)
       .then(() => {
         console.log("Email sent");
       })
       .catch((error) => {
         console.error(error);
       });
}

module.exports = {
  sendWelcomeEmail,sendDeleteMail
};

// async () => {
//   try {
//     await sgMail.send(msg);
//   } catch (error) {
//     console.error(error);

//     if (error.response) {
//       console.error(error.response.body);
//     }
//   }
// };
