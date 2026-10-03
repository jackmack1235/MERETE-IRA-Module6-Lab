"use strict";

/* ---------- Pure validation functions (no DOM access) ---------- */

var STUDENT_NUMBER_RE = /^\d{2}-\d{4}-\d{3}$/;
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var MOBILE_RE = /^(09|\+639)\d{9}$/;

function isValidStudentNumber(value) {
  if (typeof value !== "string") return false;
  return STUDENT_NUMBER_RE.test(value.trim());
}

function isValidEmail(value) {
  if (typeof value !== "string") return false;
  return EMAIL_RE.test(value.trim());
}

function isValidMobile(value) {
  if (typeof value !== "string") return false;
  return MOBILE_RE.test(value.trim());
}

// Passwords are never trimmed.
function passwordProblems(value) {
  var problems = [];
  if (typeof value !== "string") return ["be text"];
  if (value.length < 8) problems.push("be at least 8 characters");
  if (!/[A-Z]/.test(value)) problems.push("include an uppercase letter");
  if (!/\d/.test(value)) problems.push("include a digit");
  if (!/[@$!]/.test(value)) problems.push("include one of @, $, or !");
  if (/\s/.test(value)) problems.push("not contain spaces");
  return problems;
}

function isValidPassword(value) {
  return passwordProblems(value).length === 0;
}

/* ---------- Browser behavior (guarded so Node can load this file) ---------- */

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", function () {
    var form = document.getElementById("registrationForm");
    var el = function (id) { return document.getElementById(id); };

    var successMessage = el("successMessage");
    var summary = el("registrationSummary");
    var passwordFeedback = el("passwordFeedback");

    function setError(inputId, errorId, message) {
      var input = el(inputId);
      var box = el(errorId);
      box.textContent = message;
      input.setAttribute("aria-invalid", message ? "true" : "false");
    }

    /* Each checker returns an error message, or "" when valid. */
    var checks = {
      fullName: function () {
        var v = el("fullName").value.trim();
        if (v === "") return "Enter your full name.";
        if (v.length < 2) return "Full name must be at least 2 characters.";
        return "";
      },
      studentNumber: function () {
        var v = el("studentNumber").value.trim();
        if (v === "") return "Student number is required.";
        if (!isValidStudentNumber(v)) return "Enter a student number in the format 24-1234-123.";
        return "";
      },
      email: function () {
        var v = el("email").value.trim();
        if (v === "") return "Email address is required.";
        if (!isValidEmail(v)) return "Enter an email like name@example.com, with no spaces.";
        return "";
      },
      mobileNumber: function () {
        var v = el("mobileNumber").value.trim();
        if (v === "") return "Mobile number is required.";
        if (!isValidMobile(v)) return "Enter 09 or +639 followed by nine digits, with no spaces or hyphens.";
        return "";
      },
      password: function () {
        var v = el("password").value;
        if (v === "") return "Password is required.";
        var p = passwordProblems(v);
        if (p.length) return "Password must " + p.join(", ") + ".";
        return "";
      },
      confirmPassword: function () {
        var v = el("confirmPassword").value;
        if (v === "") return "Confirm your password.";
        if (v !== el("password").value) return "Passwords do not match.";
        return "";
      },
      course: function () {
        var v = el("course").value;
        if (v !== "BSIT" && v !== "BSCS") return "Select BSIT or BSCS.";
        return "";
      },
      terms: function () {
        return el("terms").checked ? "" : "You must agree to the terms to register.";
      }
    };

    function run(field) {
      var message = checks[field]();
      setError(field, field + "Error", message);
      return message === "";
    }

    function updatePasswordFeedback() {
      var v = el("password").value;
      passwordFeedback.className = "feedback";
      if (v === "") {
        passwordFeedback.textContent = "";
        return;
      }
      var p = passwordProblems(v);
      if (p.length === 0) {
        passwordFeedback.textContent = "Password meets all requirements.";
        passwordFeedback.className = "feedback ok";
      } else {
        passwordFeedback.textContent = "Password must " + p.join(", ") + ".";
      }
    }

    function clearOutput() {
      successMessage.textContent = "";
      summary.hidden = true;
      ["summaryName", "summaryStudentNumber", "summaryEmail",
       "summaryMobileNumber", "summaryCourse"].forEach(function (id) {
        el(id).textContent = "";
      });
    }

    function clearAllFeedback() {
      Object.keys(checks).forEach(function (field) {
        setError(field, field + "Error", "");
        el(field).removeAttribute("aria-invalid");
      });
      passwordFeedback.textContent = "";
      passwordFeedback.className = "feedback";
      clearOutput();
    }

    /* Submit */
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var allValid = true;
      Object.keys(checks).forEach(function (field) {
        if (!run(field)) allValid = false;
      });

      if (!allValid) {
        clearOutput();
        var firstBad = form.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        return;
      }

      el("summaryName").textContent = el("fullName").value.trim();
      el("summaryStudentNumber").textContent = el("studentNumber").value.trim();
      el("summaryEmail").textContent = el("email").value.trim();
      el("summaryMobileNumber").textContent = el("mobileNumber").value.trim();
      el("summaryCourse").textContent = el("course").value;
      successMessage.textContent = "Registration details validated successfully!";
      summary.hidden = false;
    });

    /* Password: live feedback on every keystroke */
    el("password").addEventListener("input", function () {
      updatePasswordFeedback();
      if (el("passwordError").textContent) run("password");
      if (el("confirmPassword").value !== "" || el("confirmPasswordError").textContent) {
        run("confirmPassword");
      }
    });

    /* Full name: check when leaving the field */
    el("fullName").addEventListener("blur", function () { run("fullName"); });

    /* Course and terms: check on change */
    el("course").addEventListener("change", function () { run("course"); });
    el("terms").addEventListener("change", function () { run("terms"); });

    /* Other fields: once an error is showing, re-check as the user corrects it */
    ["fullName", "studentNumber", "email", "mobileNumber", "confirmPassword"].forEach(function (field) {
      el(field).addEventListener("input", function () {
        if (el(field + "Error").textContent) run(field);
      });
    });

    /* Reset */
    form.addEventListener("reset", function () {
      clearAllFeedback();
    });
  });
}

/* Export for the autograder (CommonJS) */
if (typeof module !== "undefined" && module.exports) {
  module.exports = { isValidStudentNumber: isValidStudentNumber, isValidPassword: isValidPassword };
}