class Task {
    constructor(name, description, dueDate, completed, imageUrl) {
        this.name = name;
        this.description = description;
        this.dueDate = dueDate;
        this.completed = completed;
        this.imageUrl = imageUrl || null;
        const timestamp = new Date().getTime();
        const random = Math.floor(Math.random() * 1000);
        this.id = timestamp + "" + random.toString().padStart(3, '0');
    }
}
module.exports = { Task };