
// public/js/observation.js

export function initObservation() {

    const observationFields =
        document.getElementById("observation-fields");

    if (observationFields) {

        console.log("GROUP TYPE:", window.GROUP_TYPE);

        observationFields.classList.toggle(
            "hidden",
            window.GROUP_TYPE !== "observation"
        );
    }
}