document.addEventListener("DOMContentLoaded", function() {
    const deleteForm = document.getElementById('delete-form');
  
    deleteForm.addEventListener('submit', function(event) {
        event.preventDefault();
  
        const id = document.getElementById('id').value;
  
        fetch(`https://aurorac.onrender.com/crud/delete/${id}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('No se pudo eliminar la persona');
            }
            return response.json();
        })
        .then(data => {
            Swal.fire({
                icon: 'success',
                title: 'Persona Eliminada',
                text: data.message
            });
            deleteForm.reset();
        })
        .catch(error => {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message
            });
        });
    });
  });
  