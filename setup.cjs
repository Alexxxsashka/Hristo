const fs = require('fs');

function processFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\s+required(?!=)/g, ' ');
    fs.writeFileSync(filePath, content);
}

processFile('src/components/admin/ProductForm.tsx');
processFile('src/components/admin/CategoryManager.tsx');
processFile('src/components/admin/BlogManager.tsx');
processFile('src/components/admin/PolicyManager.tsx');
processFile('src/components/admin/ERPManager.tsx');
processFile('src/pages/RegisterPage.tsx');

function addValidationToProductForm() {
    let content = fs.readFileSync('src/components/admin/ProductForm.tsx', 'utf8');

    if (!content.includes('formErrors')) {
        content = content.replace('const [isSubmitting, setIsSubmitting] = useState(false);', 
            'const [isSubmitting, setIsSubmitting] = useState(false);\n  const [formErrors, setFormErrors] = useState<Record<string, string>>({});');

        const validateCode = `
    const errors: Record<string, string> = {};
    if (!formData.name?.trim()) errors.name = 'Products must have a name';
    if (!formData.brand?.trim()) errors.brand = 'Brand cannot be empty';
    if (formData.price === undefined || formData.price <= 0 || isNaN(formData.price)) errors.price = 'Price must be greater than 0';
    if (formData.discount !== undefined && formData.discount !== 0 && (formData.discount < 0 || formData.discount > 100 || isNaN(formData.discount))) errors.discount = 'Discount must be between 0 and 100';
    if (!formData.category) errors.category = 'Category must be selected';
    if (formData.stock === undefined || isNaN(formData.stock) || formData.stock < 0) errors.stock = 'Stock must be a valid number >= 0';
    if (!formData.description?.trim()) errors.description = 'Short description is required';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      onNotify('Пожалуйста, исправьте ошибки в форме', 'error');
      setIsSubmitting(false);
      return;
    }
`;

        content = content.replace('const handleSubmit = async (e: React.FormEvent) => {\n    e.preventDefault();\n    setIsSubmitting(true);', 
            'const handleSubmit = async (e: React.FormEvent) => {\n    e.preventDefault();\n    setIsSubmitting(true);\n' + validateCode);

        content = content.replace(/<input([^>]+value=\{formData\.name\}[^>]*)>/g, '<input$1>\n            {formErrors.name && <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.name}</p>}');
        content = content.replace(/<input([^>]+value=\{formData\.brand\}[^>]*)>/g, '<input$1>\n            {formErrors.brand && <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.brand}</p>}');
        content = content.replace(/<input([^>]+value=\{formData\.price\}[^>]*)>/g, '<input$1>\n            {formErrors.price && <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.price}</p>}');
        content = content.replace(/<input([^>]+value=\{formData\.discount[^>]*\}[^>]*)>/g, '<input$1>\n            {formErrors.discount && <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.discount}</p>}');
        content = content.replace(/<select([^>]+value=\{formData\.category\}[^>]*)>/g, '<select$1>\n            {formErrors.category && <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.category}</p>}');
        content = content.replace(/<input([^>]+value=\{formData\.stock\}[^>]*)>/g, '<input$1>\n            {formErrors.stock && <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.stock}</p>}');
        content = content.replace(/<textarea([^>]+value=\{formData\.description\}[^>]*)>/g, '<textarea$1>\n            {formErrors.description && <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.description}</p>}');

        fs.writeFileSync('src/components/admin/ProductForm.tsx', content);
    }
}

function addValidationToCategoryManager() {
    let content = fs.readFileSync('src/components/admin/CategoryManager.tsx', 'utf8');

    if (!content.includes('formErrors')) {
        content = content.replace('const [newCat, setNewCat] = useState', 
            'const [formErrors, setFormErrors] = useState<Record<string, string>>({});\n  const [newCat, setNewCat] = useState');

        const validateCode = `
    const errors: Record<string, string> = {};
    if (!newCat.name?.trim()) errors.name = 'Категория должна иметь название';
    if (newCat.discount !== undefined && newCat.discount !== 0 && (newCat.discount < 0 || newCat.discount > 100 || isNaN(newCat.discount))) errors.discount = 'Скидка должна быть от 0 до 100';

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      onNotify('Пожалуйста, исправьте ошибки в форме', 'error');
      return;
    }
`;

        content = content.replace('const handleAdd = async (e: React.FormEvent) => {\n    e.preventDefault();', 
            'const handleAdd = async (e: React.FormEvent) => {\n    e.preventDefault();\n' + validateCode);

        content = content.replace(/<input([^>]+value=\{newCat\.name\}[^>]*)>/g, '<input$1>\n              {formErrors.name && <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.name}</p>}');
        content = content.replace(/<input([^>]+value=\{newCat\.discount[^>]*\}[^>]*)>/g, '<input$1>\n              {formErrors.discount && <p className="text-xs text-red-500 mt-1 font-medium">{formErrors.discount}</p>}');

        fs.writeFileSync('src/components/admin/CategoryManager.tsx', content);
    }
}

addValidationToProductForm();
addValidationToCategoryManager();
console.log('Done');
