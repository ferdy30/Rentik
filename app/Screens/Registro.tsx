import { createUserWithEmailAndPassword } from 'firebase/auth';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Firebaseauth } from '../../FirebaseConfig';



const Registro = () => {
    


    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [Name, setName] = React.useState('');
    const [LastName, setLastName] = React.useState('');

    const auth = Firebaseauth;
   

  

  const singUp = async () => {
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
        alert('Usuario registrado con éxito. Ahora puedes iniciar sesión.');
    }
    catch (error) {
        console.error(error);
        alert('Error al registrar el usuario. Por favor, intenta de nuevo.');
    } finally {
        setLoading(false);
    }

    }


  return (
     
     
     <View style={styles.container}>
      
       <Text style={{ fontSize: 40, marginBottom: 50, fontWeight: 'bold' }}>Crear cuenta</Text>
     
     
      <TextInput value= {Name} style= {styles.input} placeholder='Nombres' autoCapitalize='none' onChangeText={(text)=> setName(text)}></TextInput>
      <TextInput value= {LastName} style= {styles.input} placeholder='Apellidos' autoCapitalize='none' onChangeText={(text)=> setLastName(text)}></TextInput>
      <TextInput value= {email} style= {styles.input} placeholder='Email' autoCapitalize='none' onChangeText={(text)=> setEmail(text)}></TextInput>
      <TextInput secureTextEntry ={true} value= {password} style= {styles.input} placeholder='Password' autoCapitalize='none' onChangeText={(text)=> setPassword(text)}></TextInput>
      
     
     
       { loading ? <ActivityIndicator size="large" color="#0000ff" /> :
    (        
        <>
        <TouchableOpacity  onPress={() => { void singUp(); }}>
          <Text style={styles.buttonTextR}>Registrarse</Text>
        </TouchableOpacity>
        </>
    ) }
    </View>
  )
};

export default Registro;

const styles = StyleSheet.create({
    container: {
        flex: 1,        
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },      
    input: {
        width: '80%',
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 10,
        backgroundColor: '#fff',
    }, 
    button: {
        width: '80%',
        height: 50,
        backgroundColor: '#020202ff', 
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,    
        marginTop: 10,
    },

    logoContainer:{
    width: '47%',
    height: '21.5%',
    marginBottom: 30,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
    buttonText: {                       
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    buttonTextR: {                       
        color: '#3a00afff',
        fontSize: 15,
        marginTop: 10,
        fontWeight: 'bold',
    },    
    link: {
        color: '#007bff',
        marginTop: 10,
    },
}
);
