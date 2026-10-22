const bookingTransitions = {
  pending: ["accepted", "rejected", "cancelled"],
  accepted: ["in_progress", "driver_arrived", "cancelled"],
  driver_arrived: ["trip_started", "cancelled"],
  trip_started: ["completed"],
  in_progress: ["completed"]
};

function canTransitionBookingStatus(
  bookingType,
  currentStatus,
  nextStatus
) {
  if (!bookingTransitions[currentStatus]?.includes(nextStatus)) {
    return false;
  }

  if (
    bookingType === "home_service" &&
    ["driver_arrived", "trip_started"].includes(nextStatus)
  ) {
    return false;
  }

  if (bookingType === "driver" && nextStatus === "in_progress") {
    return false;
  }

  return true;
}

function canTransitionServiceRequestStatus(
  currentStatus,
  nextStatus,
  actor
) {
  if (actor === "customer") {
    return (
      nextStatus === "cancelled" &&
      ["open", "accepted"].includes(currentStatus)
    );
  }

  if (actor === "worker") {
    return (
      (currentStatus === "accepted" &&
        nextStatus === "in_progress") ||
      (currentStatus === "in_progress" &&
        nextStatus === "completed")
    );
  }

  return false;
}

function canTransitionApplicationStatus(currentStatus, nextStatus) {
  const transitions = {
    submitted: ["shortlisted", "selected", "rejected"],
    shortlisted: ["selected", "rejected"],
    selected: [],
    rejected: [],
    withdrawn: []
  };

  return transitions[currentStatus]?.includes(nextStatus) ?? false;
}

module.exports = {
  canTransitionBookingStatus,
  canTransitionServiceRequestStatus,
  canTransitionApplicationStatus
};